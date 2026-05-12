import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const colors = { bg: '#111827', panel: '#1F2937', border: '#374151', text: '#FFFFFF', textMuted: '#9CA3AF', accent: '#EAB308' };
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#EAB308', '#EF4444'];
const getTodayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export default function StatisticsApp({ menus }) {
  const [orders, setOrders] = useState([]);
  const [dateMode, setDateMode] = useState('today'); // today, week, month, year, custom
  const [customStart, setCustomStart] = useState(getTodayStr());
  const [customEnd, setCustomEnd] = useState(getTodayStr());
  const [viewTab, setViewTab] = useState('trend'); // trend, time, item, category

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
      const arr = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.status !== 'waiting_scan' && data.status !== 'canceled') arr.push(data);
      });
      setOrders(arr);
    });
    return () => unsub();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    const now = new Date();
    
    if (dateMode === 'today') return d.toDateString() === now.toDateString();
    if (dateMode === 'week') { const w = new Date(); w.setDate(now.getDate()-7); return d >= w; }
    if (dateMode === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (dateMode === 'year') return d.getFullYear() === now.getFullYear();
    if (dateMode === 'custom') {
      const s = new Date(customStart); s.setHours(0,0,0,0);
      const e = new Date(customEnd); e.setHours(23,59,59,999);
      return d >= s && d <= e;
    }
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.finalPrice || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // 1. 매출 추이
  const trendMap = {};
  filteredOrders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = dateMode === 'year' ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` : o.date;
    if (!trendMap[key]) trendMap[key] = { name: key, revenue: 0 };
    trendMap[key].revenue += (o.finalPrice || 0);
  });
  const trendData = Object.values(trendMap).sort((a,b) => a.name.localeCompare(b.name));

  // 2. 시간대별
  const timeMap = {};
  for(let i=8; i<=22; i++) timeMap[`${i}시`] = { name: `${i}시`, revenue: 0 };
  filteredOrders.forEach(o => {
    const h = new Date(o.createdAt).getHours();
    if(timeMap[`${h}시`]) timeMap[`${h}시`].revenue += (o.finalPrice || 0);
  });
  const timeData = Object.values(timeMap);

  // 3. 품목별
  const itemMap = {};
  filteredOrders.forEach(o => {
    o.items.forEach(item => {
      if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, revenue: 0 };
      itemMap[item.name].revenue += (item.price * (item.qty || 1));
    });
  });
  const itemData = Object.values(itemMap).sort((a,b) => b.revenue - a.revenue).slice(0, 15);

  // 4. 카테고리별
  const categoryMap = {};
  const getCategory = (name) => menus.find(m => m.name === name)?.category || '기타';
  filteredOrders.forEach(o => {
    o.items.forEach(item => {
      const cat = getCategory(item.name);
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, revenue: 0 };
      categoryMap[cat].revenue += (item.price * (item.qty || 1));
    });
  });
  const categoryData = Object.values(categoryMap).sort((a,b) => b.revenue - a.revenue);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, color: '#FFFFFF', fontFamily: 'sans-serif', padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 size={36} color={colors.accent} />
          <h1 style={{ margin: 0, fontSize: '28px' }}>매출 통계 대시보드</h1>
        </div>
        <button onClick={() => window.location.href = '/manager'} style={{ padding: '10px 20px', backgroundColor: colors.panel, color: '#FFFFFF', border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>포스로 돌아가기</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', backgroundColor: colors.panel, padding: '8px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
          {[{id:'today', label:'오늘'}, {id:'week', label:'최근 7일'}, {id:'month', label:'이번 달'}, {id:'year', label:'올해'}, {id:'custom', label:'직접 지정'}].map(btn => (
            <button key={btn.id} onClick={() => setDateMode(btn.id)} style={{ padding: '10px 16px', backgroundColor: dateMode === btn.id ? colors.accent : 'transparent', color: dateMode === btn.id ? colors.bg : '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{btn.label}</button>
          ))}
        </div>
        {dateMode === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: colors.panel, padding: '8px 16px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
            <Calendar size={20} color={colors.textMuted} />
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', outline: 'none' }} />
            <span>~</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', outline: 'none' }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: colors.panel, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
          <div style={{ color: colors.textMuted, fontSize: '16px', marginBottom: '8px' }}>총 매출액</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: colors.accent }}>{totalRevenue.toLocaleString()}원</div>
        </div>
        <div style={{ flex: 1, backgroundColor: colors.panel, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
          <div style={{ color: colors.textMuted, fontSize: '16px', marginBottom: '8px' }}>총 결제 건수</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3B82F6' }}>{totalOrders}건</div>
        </div>
        <div style={{ flex: 1, backgroundColor: colors.panel, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
          <div style={{ color: colors.textMuted, fontSize: '16px', marginBottom: '8px' }}>건당 평균 결제액</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10B981' }}>{Math.round(avgOrderValue).toLocaleString()}원</div>
        </div>
      </div>

      <div style={{ backgroundColor: colors.panel, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '24px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
          {[{id:'trend', label:'매출 추이'}, {id:'time', label:'시간대별'}, {id:'item', label:'품목별 매출'}, {id:'category', label:'카테고리별'}].map(tab => (
            <button key={tab.id} onClick={() => setViewTab(tab.id)} style={{ padding: '10px 20px', backgroundColor: viewTab === tab.id ? colors.bg : 'transparent', color: viewTab === tab.id ? colors.accent : colors.textMuted, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ height: '400px' }}>
          {viewTab === 'trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="name" stroke={colors.textMuted} />
                <YAxis stroke={colors.textMuted} />
                <Tooltip contentStyle={{ backgroundColor: colors.panel, borderColor: colors.border, color: '#fff' }} />
                <Line type="monotone" dataKey="revenue" name="매출액(원)" stroke={colors.accent} strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {viewTab === 'time' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="name" stroke={colors.textMuted} />
                <YAxis stroke={colors.textMuted} />
                <Tooltip contentStyle={{ backgroundColor: colors.panel, borderColor: colors.border, color: '#fff' }} />
                <Bar dataKey="revenue" name="매출액(원)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {viewTab === 'item' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={itemData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis type="number" stroke={colors.textMuted} />
                <YAxis dataKey="name" type="category" stroke={colors.textMuted} width={100} />
                <Tooltip contentStyle={{ backgroundColor: colors.panel, borderColor: colors.border, color: '#fff' }} />
                <Bar dataKey="revenue" name="매출액(원)" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {viewTab === 'category' && (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={categoryData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={150} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: colors.panel, borderColor: colors.border, color: '#fff' }} />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
