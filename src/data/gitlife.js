export const CATEGORIES = ['Career','Health','Relationships','Finance','Education','Travel','Housing'];

export const DAY_LABELS  = ['M','','W','','F','',''];
export const CELL_COLORS = ['oklch(93% 0.04 260)','oklch(80% 0.1 260)','oklch(68% 0.15 260)','oklch(58% 0.18 260)','oklch(52% 0.2 260)'];

export const fmt = n => n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n);

export const catColor = cat => {
  const h = {Career:'260',Health:'155',Relationships:'330',Finance:'60',Education:'200',Travel:'25',Housing:'80'}[cat]||'260';
  return { bg:`oklch(93% 0.04 ${h})`, fg:`oklch(40% 0.12 ${h})` };
};
