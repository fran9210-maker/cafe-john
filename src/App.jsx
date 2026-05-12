import React, { useState, useEffect, useRef } from 'react';
import { Coffee, ShoppingCart, X, CheckCircle, Clock, ChevronRight, Plus, Minus, User, Users, Trash2, Undo2, BarChart3, ListPlus, Search, ArrowUpDown, Printer, Timer, Edit } from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot, deleteDoc, addDoc } from 'firebase/firestore';

// 💡 방금 새로 만든 통계 컴포넌트를 불러옵니다!
import StatisticsApp from './StatisticsApp';

const colors = { bg: '#111827', panel: '#1F2937', border: '#374151', text: '#FFFFFF', textMuted: '#9CA3AF', accent: '#EAB308', danger: '#EF4444' };
const getTodayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <Coffee size={36} color={colors.accent} />
    <h1 style={{ color: '#FFFFFF', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>그대 요한을 만나다</h1>
  </div>
);

// ==========================================
// 1. 고객용 앱 (CustomerApp)
// ==========================================
function CustomerApp({ menus }) {
  const [phone, setPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [activeCategory, setActiveCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [orderQRData, setOrderQRData] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [options, setOptions] = useState({ temp: 'ICE', shot: 0 });
  const [quantity, setQuantity] = useState(1);

  const CATEGORIES = [...new Set(menus.map(m => m.category))];
  useEffect(() => { if (CATEGORIES.length > 0 && !activeCategory) setActiveCategory(CATEGORIES[0]); }, [CATEGORIES, activeCategory]);

  const handleLogin = async () => {
    if (phone.length < 10) return alert('정확한 전화번호를 입력해주세요.');
    const uRef = doc(db, 'users', phone);
    const uSnap = await getDoc(uRef);
    if (uSnap.exists()) setUserPoints(uSnap.data().points || 0);
    else { await setDoc(uRef, { points: 0, phone, createdAt: Date.now() }); setUserPoints(0); }
    setIsLoggedIn(true);
  };

  const confirmAddToCart = () => {
    setCart([{ id: Date.now(), name: selectedMenu.name, price: selectedMenu.price + (options.shot * 500), options: { ...options }, qty: quantity }, ...cart]); 
    setSelectedMenu(null);
  };

  const totalPrice = cart.reduce((tot, item) => tot + (item.price * (item.qty || 1)), 0);
  const finalPrice = totalPrice - pointsToUse;
  const earnedPoints = Math.floor(finalPrice * 0.05);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const orderId = `ORD-${String(Date.now()).slice(-4)}`;
    await setDoc(doc(db, 'orders', orderId), {
      id: orderId, items: cart, total: totalPrice, finalPrice, usedPoints: pointsToUse, earnedPoints, phone,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      status: 'waiting_scan', createdAt: Date.now(), date: getTodayStr(), isArchived: false
    });
    setOrderQRData(orderId);
  };

  if (!isLoggedIn) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: colors.bg, color: colors.text }}>
      <div style={{ marginBottom: '40px' }}><Logo /></div>
      <div style={{ backgroundColor: colors.panel, padding: '40px', borderRadius: '16px', border: `1px solid ${colors.border}`, textAlign: 'center', width: '90%', maxWidth: '400px' }}>
        <h2 style={{ marginTop: 0, color: '#FFFFFF' }}>전화번호로 시작하기</h2>
        <input type="tel" placeholder="01012345678 (- 없이 입력)" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.bg, color: '#FFFFFF', fontSize: '18px', marginBottom: '20px', textAlign: 'center' }} />
        <button onClick={handleLogin} style={{ width: '100%', padding: '16px', backgroundColor: colors.accent, color: colors.bg, border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>입장하기</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: colors.bg, minHeight: '100vh', color: colors.text }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', marginBottom: '20px', borderBottom: `1px solid ${colors.border}` }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: colors.panel, padding: '10px 16px', borderRadius: '20px', border: `1px solid ${colors.border}` }}>
          <User size={20} color={colors.accent} />
          <span style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{phone} 님</span>
          <span style={{ color: colors.accent, marginLeft: '10px' }}>{userPoints.toLocaleString()} P</span>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '350px', backgroundColor: colors.panel, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#374151', padding: '6px', borderRadius: '12px', overflowX: 'auto' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ flex: 1, padding: '12px 20px', fontSize: '16px', fontWeight: 'bold', backgroundColor: activeCategory === cat ? '#4B5563' : 'transparent', color: activeCategory === cat ? colors.accent : colors.textMuted, border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{cat}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
            {menus.filter(m => m.category === activeCategory).map((m) => (
              <button key={m.id} onClick={() => { setSelectedMenu(m); setOptions({ temp: m.hasTemp ? 'ICE' : 'NONE', shot: 0 }); setQuantity(1); }} style={{ padding: '24px 10px', border: `1px solid ${colors.border}`, borderRadius: '16px', backgroundColor: colors.bg, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>{m.name}</span>
                <span style={{ fontSize: '16px', color: colors.accent, fontWeight: 'bold' }}>{m.price.toLocaleString()}원</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '350px', backgroundColor: colors.panel, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
          {orderQRData ? (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#FFFFFF', marginTop: 0, fontSize: '20px' }}>주문 QR 코드</h2>
              <div style={{ background: 'white', padding: '20px', display: 'inline-block', borderRadius: '12px', marginBottom: '20px' }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${orderQRData}`} alt="QR" style={{ display: 'block' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={async () => { await deleteDoc(doc(db, 'orders', orderQRData)); setOrderQRData(null); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: '#FFFFFF', border: `2px solid ${colors.border}`, borderRadius: '12px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><Undo2 size={20} /> 주문 수정하기 (뒤로가기)</button>
                <button onClick={() => { setCart([]); setOrderQRData(null); setPointsToUse(0); }} style={{ width: '100%', padding: '16px', backgroundColor: '#374151', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>새 주문하기 (장바구니 비우기)</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, marginBottom: '20px', fontSize: '20px', color: '#FFFFFF' }}><ShoppingCart color={colors.accent} /> 장바구니</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', maxHeight: '300px', overflowY: 'auto' }}>
                {cart.map((item, index) => (
                  <li key={item.id} style={{ padding: '16px 0', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between' }}>
                    <div><div style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{item.name} <span style={{ color: colors.accent }}>x {item.qty || 1}</span></div><div style={{ fontSize: '13px', color: colors.textMuted }}>{item.options.temp} {item.options.shot > 0 && `(샷추가 ${item.options.shot})`}</div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ color: colors.accent, fontWeight: 'bold' }}>{(item.price * (item.qty || 1)).toLocaleString()}원</span><button onClick={() => setCart(cart.filter((_, i) => i !== index))} style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer' }}><X size={20} /></button></div>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: colors.textMuted }}><span>주문 금액</span><span>{totalPrice.toLocaleString()}원</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: colors.danger }}><span>포인트 할인</span><span>- {pointsToUse.toLocaleString()}원</span></div>
                <div style={{ fontWeight: 'bold', fontSize: '22px', display: 'flex', justifyContent: 'space-between', borderTop: `2px solid ${colors.border}`, paddingTop: '16px', marginBottom: '20px', color: '#FFFFFF' }}><span>최종 결제</span><span style={{ color: colors.accent }}>{finalPrice.toLocaleString()}원</span></div>
                <button onClick={handleCheckout} style={{ width: '100%', padding: '18px', backgroundColor: colors.accent, color: colors.bg, border: 'none', borderRadius: '12px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>주문 QR코드 생성하기</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedMenu && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.panel, padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h2 style={{ margin: 0, color: '#FFFFFF' }}>{selectedMenu.name}</h2><button onClick={() => setSelectedMenu(null)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><X size={28} /></button></div>
            {selectedMenu.hasTemp && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setOptions({...options, temp: 'ICE'})} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `2px solid ${options.temp === 'ICE' ? '#3B82F6' : colors.border}`, backgroundColor: colors.bg, color: options.temp === 'ICE' ? '#3B82F6' : '#FFFFFF', fontWeight: 'bold', cursor: 'pointer' }}>🧊 ICE</button>
                <button onClick={() => setOptions({...options, temp: 'HOT'})} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `2px solid ${options.temp === 'HOT' ? '#EF4444' : colors.border}`, backgroundColor: colors.bg, color: options.temp === 'HOT' ? '#EF4444' : '#FFFFFF', fontWeight: 'bold', cursor: 'pointer' }}>🔥 HOT</button>
              </div>
            )}
            {selectedMenu.hasShot && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bg, padding: '12px 20px', borderRadius: '12px', border: `1px solid ${colors.border}`, marginBottom: '20px', color: '#FFFFFF' }}>
                <span>샷 추가 (+500원)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}><button onClick={() => setOptions({...options, shot: Math.max(0, options.shot - 1)})} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '50%', width: '36px', height: '36px', color: '#FFFFFF', cursor: 'pointer' }}><Minus size={18} /></button><span style={{ fontSize: '20px', fontWeight: 'bold' }}>{options.shot}</span><button onClick={() => setOptions({...options, shot: options.shot + 1})} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '50%', width: '36px', height: '36px', color: '#FFFFFF', cursor: 'pointer' }}><Plus size={18} /></button></div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bg, padding: '12px 20px', borderRadius: '12px', border: `1px solid ${colors.border}`, marginBottom: '20px', color: '#FFFFFF' }}>
              <span>수량 선택</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}><button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '50%', width: '36px', height: '36px', color: '#FFFFFF', cursor: 'pointer' }}><Minus size={18} /></button><span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.accent }}>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '50%', width: '36px', height: '36px', color: '#FFFFFF', cursor: 'pointer' }}><Plus size={18} /></button></div>
            </div>
            <button onClick={confirmAddToCart} style={{ width: '100%', padding: '18px', backgroundColor: colors.accent, color: colors.bg, border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>장바구니 담기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. 매니저 앱 (ManagerApp)
// ==========================================
function ManagerApp({ menus }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [scanValue, setScanValue] = useState('');
  const [usersList, setUsersList] = useState([]);
  const inputRef = useRef(null);

  const [newMenu, setNewMenu] = useState({ name: '', price: '', category: '', hasTemp: false, hasShot: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('latest'); 
  
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerPoints, setNewCustomerPoints] = useState('');

  useEffect(() => { if (inputRef.current && !['customers','menus'].includes(activeTab)) inputRef.current.focus(); }, [activeTab]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
      const arr = []; snap.forEach(d => arr.push(d.data()));
      setOrders(arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeTab === 'customers') {
      const unsub = onSnapshot(collection(db, 'users'), (snap) => {
        const u = []; snap.forEach(d => u.push({ id: d.id, ...d.data() })); setUsersList(u);
      });
      return () => unsub();
    }
  }, [activeTab]);

  const processQRData = async (scannedText) => {
    const num = scannedText.replace(/[^0-9]/g, '');
    if (!num) return setScanValue('');
    const orderId = `ORD-${num}`;
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      const info = orderSnap.data();
      if (info.status !== 'waiting_scan') return alert('이미 처리된 주문입니다.');
      if (info.phone) {
        const uRef = doc(db, 'users', info.phone);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) await updateDoc(uRef, { points: (uSnap.data().points || 0) - (info.usedPoints || 0) + (info.earnedPoints || 0) });
      }
      await updateDoc(orderRef, { status: 'pending' });
      setScanValue(''); setActiveTab('pending');
    } else { alert('등록되지 않은 바코드입니다.'); setScanValue(''); }
  };

  const updateStatus = async (id, status) => await updateDoc(doc(db, 'orders', id), { status, completedAt: status === 'completed' ? Date.now() : null });
  const archiveOrder = async (id) => { if (window.confirm('화면에서 지우시겠습니까?')) await updateDoc(doc(db, 'orders', id), { isArchived: true }); };

  const printReceipt = (order) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    
    const printContent = `
      <html><head><title>영수증</title>
      <style>
        @page { margin: 0; }
        body { font-family: 'Malgun Gothic', sans-serif; width: 100%; max-width: 320px; margin: 0; padding: 0; color: #000; font-size: 18px; line-height: 1.2; }
        .flex { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .line { border-top: 2px dashed #000; margin: 8px 0; }
        .title { font-size: 24px; font-weight: bold; text-align: center; margin: 0 0 5px 0; }
        .info { font-size: 16px; text-align: center; margin-bottom: 2px; }
        .item-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-bottom: 2px; }
        .item-name { flex: 2; text-align: left; }
        .item-qty { flex: 1; text-align: center; }
        .item-price { flex: 1; text-align: right; }
        .item-opt { font-size: 16px; color: #333; margin-bottom: 6px; padding-left: 10px; }
        .price-row { font-size: 18px; }
        .final-row { font-size: 22px; font-weight: bold; margin-top: 5px; }
      </style></head><body>
      <div class="title">☕ 그대 요한을 만나다</div>
      <div class="info">주문번호: ${order.id}</div>
      <div class="info">${order.date} ${order.time}</div>
      <div class="line"></div>
      ${order.items.map(i => `
        <div class="item-row"><span class="item-name">${i.name}</span><span class="item-qty">x ${i.qty||1}</span><span class="item-price">${(i.price*(i.qty||1)).toLocaleString()}원</span></div>
        <div class="item-opt">- ${i.options.temp}${i.options.shot>0?`, 샷추가 ${i.options.shot}`:''}</div>
      `).join('')}
      <div class="line"></div>
      <div class="flex price-row"><span>주문금액</span><span>${order.total.toLocaleString()}원</span></div>
      <div class="flex price-row"><span>포인트할인</span><span>-${order.usedPoints.toLocaleString()}원</span></div>
      <div class="line"></div>
      <div class="flex final-row"><span>결제금액</span><span>${order.finalPrice.toLocaleString()}원</span></div>
      <div class="line"></div>
      <div class="info">회원: ${order.phone || '비회원'}</div>
      <div class="info">적립: ${order.earnedPoints.toLocaleString()}P</div>
      <div class="line"></div>
      <div class="title" style="font-size: 20px; margin-top: 10px;">감사합니다</div>
      </body></html>
    `;
    
    doc.write(printContent);
    doc.close();
    
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 3000);
    }, 300);
  };

  const handleAddMenu = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'menus'), { name: newMenu.name, price: Number(newMenu.price), category: newMenu.category, hasTemp: newMenu.hasTemp, hasShot: newMenu.hasShot });
    alert('메뉴 추가됨!'); setNewMenu({ name: '', price: '', category: '', hasTemp: false, hasShot: false });
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (newCustomerPhone.length < 10) return alert('정확한 전화번호를 입력하세요.');
    const ref = doc(db, 'users', newCustomerPhone);
    const snap = await getDoc(ref);
    if (snap.exists()) return alert('이미 등록된 고객입니다.');
    await setDoc(ref, { phone: newCustomerPhone, points: Number(newCustomerPoints) || 0, createdAt: Date.now() });
    alert('고객이 추가되었습니다.');
    setNewCustomerPhone(''); setNewCustomerPoints('');
  };

  const handleDeleteCustomer = async (phone) => {
    if (window.confirm(`${phone} 고객을 정말 삭제하시겠습니까?`)) await deleteDoc(doc(db, 'users', phone));
  };

  const handleEditPoints = async (phone, currentPoints) => {
    const val = window.prompt(`${phone} 고객의 새로운 포인트 금액을 입력하세요:`, currentPoints);
    if (val !== null && !isNaN(val)) await updateDoc(doc(db, 'users', phone), { points: Number(val) });
  };

  const pendingOrders = orders.filter(o => o.status === 'pending' && !o.isArchived);
  const makingOrders = orders.filter(o => o.status === 'making' && !o.isArchived);
  const completedOrders = orders.filter(o => o.status === 'completed' && !o.isArchived);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bg, color: '#FFFFFF', fontFamily: 'sans-serif' }} onClick={() => { if(!['customers','menus'].includes(activeTab)) inputRef.current?.focus() }}>
      <div style={{ width: '350px', backgroundColor: colors.panel, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}><Coffee color={colors.accent} size={32} /><h1 style={{ margin: 0, fontSize: '20px', color: '#FFFFFF' }}>매니저 POS</h1></div>
        <div style={{ padding: '24px', backgroundColor: '#111827', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: colors.accent }}><span style={{ fontSize: '24px' }}>⌨️</span><h2 style={{ margin: 0, fontSize: '16px', color: colors.accent }}>바코드 스캐너 대기중...</h2></div>
          <form onSubmit={(e) => { e.preventDefault(); if (scanValue) processQRData(scanValue); }}>
            <input ref={inputRef} type="text" value={scanValue} onChange={(e) => setScanValue(e.target.value)} placeholder="여기에 바코드가 입력됩니다" style={{ width: '100%', padding: '16px', borderRadius: '8px', border: `2px solid ${colors.accent}`, backgroundColor: colors.bg, color: '#FFFFFF', fontSize: '18px', outline: 'none' }} />
          </form>
        </div>
        <div style={{ padding: '20px', marginTop: 'auto', borderTop: `1px solid ${colors.border}` }}>
          <button onClick={() => window.open('/statistics', '_blank')} style={{ width: '100%', padding: '16px', backgroundColor: '#8B5CF6', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><BarChart3 size={20} /> 통계 대시보드 열기</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', backgroundColor: colors.panel, borderBottom: `1px solid ${colors.border}` }}>
          <button onClick={() => setActiveTab('pending')} style={{ flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: activeTab === 'pending' ? colors.bg : 'transparent', color: activeTab === 'pending' ? colors.accent : colors.textMuted, border: 'none', borderBottom: activeTab === 'pending' ? `3px solid ${colors.accent}` : '3px solid transparent', cursor: 'pointer' }}><Clock size={18} /> 접수 대기 ({pendingOrders.length})</button>
          <button onClick={() => setActiveTab('making')} style={{ flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: activeTab === 'making' ? colors.bg : 'transparent', color: activeTab === 'making' ? '#3B82F6' : colors.textMuted, border: 'none', borderBottom: activeTab === 'making' ? `3px solid #3B82F6` : '3px solid transparent', cursor: 'pointer' }}><Timer size={18} /> 제조 대기 ({makingOrders.length})</button>
          <button onClick={() => setActiveTab('completed')} style={{ flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: activeTab === 'completed' ? colors.bg : 'transparent', color: activeTab === 'completed' ? '#4ADE80' : colors.textMuted, border: 'none', borderBottom: activeTab === 'completed' ? `3px solid #4ADE80` : '3px solid transparent', cursor: 'pointer' }}><CheckCircle size={18} /> 제조 완료 ({completedOrders.length})</button>
          <button onClick={() => setActiveTab('menus')} style={{ flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: activeTab === 'menus' ? colors.bg : 'transparent', color: activeTab === 'menus' ? '#A855F7' : colors.textMuted, border: 'none', borderBottom: activeTab === 'menus' ? `3px solid #A855F7` : '3px solid transparent', cursor: 'pointer' }}><ListPlus size={18} /> 메뉴 관리</button>
          <button onClick={() => setActiveTab('customers')} style={{ flex: 1, padding: '16px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: activeTab === 'customers' ? colors.bg : 'transparent', color: activeTab === 'customers' ? '#60A5FA' : colors.textMuted, border: 'none', borderBottom: activeTab === 'customers' ? `3px solid #60A5FA` : '3px solid transparent', cursor: 'pointer' }}><Users size={18} /> 고객 관리</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'menus' && (
            <div style={{ padding: '24px', display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1, backgroundColor: colors.panel, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#FFFFFF' }}>새 메뉴 등록</h2>
                <form onSubmit={handleAddMenu} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input type="text" placeholder="메뉴명" value={newMenu.name} onChange={e => setNewMenu({...newMenu, name: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.bg, color: '#FFFFFF' }} />
                  <input type="number" placeholder="가격" value={newMenu.price} onChange={e => setNewMenu({...newMenu, price: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.bg, color: '#FFFFFF' }} />
                  <input type="text" placeholder="카테고리" value={newMenu.category} onChange={e => setNewMenu({...newMenu, category: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.bg, color: '#FFFFFF' }} />
                  <div style={{ display: 'flex', gap: '20px', padding: '12px', backgroundColor: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <label><input type="checkbox" checked={newMenu.hasTemp} onChange={e => setNewMenu({...newMenu, hasTemp: e.target.checked})} /> ICE/HOT 선택</label>
                    <label><input type="checkbox" checked={newMenu.hasShot} onChange={e => setNewMenu({...newMenu, hasShot: e.target.checked})} /> 샷 추가</label>
                  </div>
                  <button type="submit" style={{ padding: '16px', backgroundColor: '#A855F7', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>메뉴 추가하기</button>
                </form>
              </div>
              <div style={{ flex: 1, backgroundColor: colors.panel, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#FFFFFF' }}>등록된 메뉴 목록 ({menus.length}개)</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                  {menus.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                      <div><div style={{ fontWeight: 'bold', fontSize: '16px', color: '#FFFFFF' }}>{m.name}</div><div style={{ color: colors.textMuted, fontSize: '14px' }}>{m.category} | {m.price.toLocaleString()}원</div></div>
                      <button onClick={async () => { if(window.confirm('삭제?')) await deleteDoc(doc(db, 'menus', m.id)); }} style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer' }}><Trash2 size={20} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div style={{ padding: '24px', display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1, backgroundColor: colors.panel, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}`, height: 'fit-content' }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#FFFFFF' }}>새 고객 수동 추가</h2>
                <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input type="tel" placeholder="전화번호 (예: 01012345678)" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.bg, color: '#FFFFFF' }} />
                  <input type="number" placeholder="초기 포인트 (기본 0)" value={newCustomerPoints} onChange={e => setNewCustomerPoints(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.bg, color: '#FFFFFF' }} />
                  <button type="submit" style={{ padding: '16px', backgroundColor: '#60A5FA', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>고객 추가하기</button>
                </form>
              </div>
              <div style={{ flex: 2 }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '0 16px' }}><Search size={20} color={colors.textMuted} /><input type="text" placeholder="전화번호 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '16px 12px', background: 'transparent', border: 'none', color: '#FFFFFF', outline: 'none', fontSize: '16px' }} /></div>
                  <button onClick={() => setSortType(sortType === 'pointsDesc' ? 'pointsAsc' : 'pointsDesc')} style={{ padding: '0 24px', backgroundColor: colors.panel, color: '#FFFFFF', border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowUpDown size={20} /> 포인트순 정렬</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
                  {usersList.filter(u => u.phone.includes(searchQuery)).sort((a,b) => sortType === 'pointsDesc' ? (b.points||0)-(a.points||0) : (a.points||0)-(b.points||0)).map(u => (
                    <div key={u.phone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: colors.panel, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>{u.phone}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ color: colors.accent, fontWeight: 'bold', fontSize: '18px' }}>{u.points?.toLocaleString()} P</span>
                        <button onClick={() => handleEditPoints(u.phone, u.points || 0)} style={{ background: '#374151', border: 'none', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Edit size={16} /> 포인트 수정</button>
                        <button onClick={() => handleDeleteCustomer(u.phone)} style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer', padding: '8px' }}><Trash2 size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {['pending', 'making', 'completed'].includes(activeTab) && (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(activeTab === 'pending' ? pendingOrders : activeTab === 'making' ? makingOrders : completedOrders).map(order => (
                <div key={order.id} style={{ backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><span style={{ backgroundColor: '#374151', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', color: '#FFFFFF' }}>{order.id}</span><span style={{ color: colors.textMuted }}>{order.time} 접수</span><span style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>회원: {order.phone}</span></div>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#FFFFFF' }}><ChevronRight size={18} color={colors.accent} style={{ verticalAlign: 'middle' }} /> {item.name} <span style={{ color: colors.textMuted, fontSize: '14px' }}>x {item.qty || 1} ({item.options.temp}{item.options.shot > 0 ? `, 샷추가 ${item.options.shot}` : ''})</span></div>
                    ))}
                  </div>
                  {order.status === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button onClick={() => { updateStatus(order.id, 'making'); printReceipt(order); }} style={{ backgroundColor: '#3B82F6', color: '#FFFFFF', padding: '16px 24px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Printer size={20} /> 결제 완료 및 영수증 인쇄</button>
                      <button onClick={() => updateStatus(order.id, 'canceled')} style={{ backgroundColor: 'transparent', color: colors.danger, border: `1px solid ${colors.danger}`, padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>취소</button>
                    </div>
                  )}
                  {order.status === 'making' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button onClick={() => updateStatus(order.id, 'completed')} style={{ backgroundColor: '#16A34A', color: '#FFFFFF', padding: '16px 24px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
