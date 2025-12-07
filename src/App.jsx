import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  Send, 
  List, 
  User, 
  Gift, 
  MessageSquare, 
  Loader2, 
  CheckCircle2
} from 'lucide-react';

// ==========================================
// 🔴 请将下面的配置替换为你自己的 Firebase 配置
// ==========================================
const firebaseConfig = {
  // 去 firebase console -> 项目设置 -> 常规 -> 下方的 "SDK 设置和配置" 复制这些内容
  apiKey: "你的apiKey",
  authDomain: "你的项目ID.firebaseapp.com",
  projectId: "你的项目ID",
  storageBucket: "你的项目ID.appspot.com",
  messagingSenderId: "你的数字ID",
  appId: "你的AppID"
};

// 初始化 Firebase
// 如果没有配置，这里会报错，请确保上方配置正确
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase 初始化失败，请检查配置", e);
}

const appId = "wishlist-public";

export default function WishListApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('submit'); 
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // 1. 登录
  useEffect(() => {
    if (!auth) return;
    signInAnonymously(auth).catch((error) => {
        console.error("登录失败:", error);
    });
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 2. 获取数据
  useEffect(() => {
    if (!user || !db) return;

    const wishesRef = collection(db, 'wishes'); 

    const unsubscribe = onSnapshot(wishesRef, (snapshot) => {
      const fetchedWishes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      fetchedWishes.sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.seconds : 0;
        const timeB = b.timestamp ? b.timestamp.seconds : 0;
        return timeB - timeA;
      });

      setWishes(fetchedWishes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. 提交数据
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    if (!db) { alert("请先配置 Firebase"); return; }
    
    setIsSubmitting(true);

    try {
      const wishesRef = collection(db, 'wishes');
      await addDoc(wishesRef, {
        name: name.trim(),
        content: content.trim(),
        userId: user.uid,
        timestamp: serverTimestamp(),
        dateStr: new Date().toLocaleString('zh-CN')
      });

      setName('');
      setContent('');
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('list');
      }, 1500);

    } catch (error) {
      console.error("提交错误:", error);
      alert("提交失败，请检查网络或 Firebase 规则设置。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 内联样式帮助函数
  const styles = {
    container: { maxWidth: '450px', margin: '0 auto', minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' },
    header: { background: 'white', padding: '16px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', fontSize: '1.25rem', color: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    tabBar: { display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb' },
    tab: (isActive) => ({ flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer', borderBottom: isActive ? '2px solid #2563eb' : 'none', color: isActive ? '#2563eb' : '#6b7280', fontWeight: 500 }),
    main: { flex: 1, padding: '16px', overflowY: 'auto' },
    card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' },
    inputGroup: { marginBottom: '16px' },
    label: { display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '4px' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' },
    button: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
    wishItem: { background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #f3f4f6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    nameTag: { display: 'flex', alignItems: 'center', marginBottom: '8px' },
    avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '8px' }
  };

  if (!user && loading) return <div style={{display:'flex',justifyContent:'center',marginTop:'50px'}}>Loading...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Gift size={24} style={{marginRight:'8px', color:'#3b82f6'}} /> 需求收集小助手
      </header>

      <div style={styles.tabBar}>
        <div style={styles.tab(activeTab === 'submit')} onClick={() => setActiveTab('submit')}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}><Send size={16} style={{marginRight:'6px'}}/> 填写需求</div>
        </div>
        <div style={styles.tab(activeTab === 'list')} onClick={() => setActiveTab('list')}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}><List size={16} style={{marginRight:'6px'}}/> 查看汇总 ({wishes.length})</div>
        </div>
      </div>

      <main style={styles.main}>
        {activeTab === 'submit' && (
          <div style={styles.card}>
            <h2 style={{fontSize:'1.1rem', marginBottom:'16px', color:'#374151'}}>如果你想要什么，请告诉我</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>我是谁</label>
                <div style={{position:'relative'}}>
                  <User size={20} color="#9ca3af" style={{position:'absolute', left:'10px', top:'10px'}}/>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="例如：张三" style={{...styles.input, paddingLeft:'36px'}} required />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>我的需求</label>
                <div style={{position:'relative'}}>
                  <MessageSquare size={20} color="#9ca3af" style={{position:'absolute', left:'10px', top:'10px'}}/>
                  <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="请详细描述..." rows={4} style={{...styles.input, paddingLeft:'36px', resize:'vertical'}} required />
                </div>
              </div>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting || submitSuccess} style={{...styles.button, background: submitSuccess ? '#22c55e' : '#2563eb', opacity: isSubmitting ? 0.7 : 1}}>
                 {isSubmitting ? '提交中...' : submitSuccess ? '提交成功！' : '发送需求'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'list' && (
          <div>
            {wishes.length === 0 && !loading && <div style={{textAlign:'center', padding:'40px', color:'#9ca3af'}}>暂时没有需求</div>}
            {wishes.map(wish => (
              <div key={wish.id} style={styles.wishItem}>
                <div style={styles.nameTag}>
                   <div style={styles.avatar}>{wish.name ? wish.name[0] : '?'}</div>
                   <div style={{fontWeight:'bold', color:'#1f2937'}}>{wish.name}</div>
                   <div style={{marginLeft:'auto', fontSize:'0.75rem', color:'#9ca3af'}}>{wish.dateStr?.split(' ')[0]}</div>
                </div>
                <div style={{paddingLeft:'40px', color:'#4b5563', whiteSpace:'pre-wrap'}}>{wish.content}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
