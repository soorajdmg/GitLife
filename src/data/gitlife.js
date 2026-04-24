export const USERS = {
  alex:   { id:'alex',   name:'Alex Chen',    handle:'@alex.chen',    ini:'AC', color:'oklch(52% 0.2 260)',  bio:'Building things. Living intentionally.',  commits:47, branches:5,  followers:1240, following:89  },
  maya:   { id:'maya',   name:'Maya Patel',   handle:'@maya.patel',   ini:'MP', color:'oklch(56% 0.2 330)',  bio:'UX designer. Coffee person.',             commits:31, branches:3,  followers:892,  following:156 },
  jordan: { id:'jordan', name:'Jordan Lee',   handle:'@jordan.lee',   ini:'JL', color:'oklch(50% 0.18 155)', bio:'Trying new things every year.',           commits:88, branches:11, followers:3401, following:234 },
  sam:    { id:'sam',    name:'Sam Rivera',   handle:'@sam.rivera',   ini:'SR', color:'oklch(60% 0.19 55)',  bio:'Optimist. Builder.',                      commits:22, branches:2,  followers:445,  following:67  },
  taylor: { id:'taylor', name:'Taylor Kim',   handle:'@taylor.kim',   ini:'TK', color:'oklch(52% 0.18 200)', bio:'Data scientist by day.',                  commits:56, branches:7,  followers:2100, following:311 },
};

export const ME = USERS.alex;
export const CATEGORIES = ['Career','Health','Relationships','Finance','Education','Travel','Housing'];

export const MY_BRANCHES = [
  { id:'main',       name:'main',                color:'oklch(52% 0.2 260)',  merged:false },
  { id:'wi-startup', name:'what-if/startup',     color:'oklch(60% 0.19 55)',  merged:false },
  { id:'wi-nyc',     name:'what-if/move-to-nyc', color:'oklch(56% 0.18 200)', merged:false },
  { id:'wi-phd',     name:'what-if/phd',         color:'oklch(56% 0.2 330)',  merged:true  },
];

export const INIT_FEED = [
  { id:'c1', userId:'jordan', branch:'main',                   message:'Quit corporate job to freelance full-time',          body:'After 4 years at the agency, I finally made the call. Saved 8 months of runway. Scared but ready.',      category:'Career',        ts:'2h ago',  rx:{fork:142,merge:67, support:203}, ur:{}, wi:false, img:'https://picsum.photos/seed/desk1/600/280' },
  { id:'c2', userId:'maya',   branch:'what-if/move-abroad',    message:'What if I moved to Lisbon for a year?',              body:'Remote-friendly company, lower cost of living, beautiful city. Running the numbers on a 12-month stint.', category:'Travel',        ts:'4h ago',  rx:{fork:88, merge:31, support:167}, ur:{}, wi:true,  img:'https://picsum.photos/seed/lisbon/600/280' },
  { id:'c3', userId:'sam',    branch:'main',                   message:'Started therapy — first session done',               body:null,                                                                                                    category:'Health',        ts:'6h ago',  rx:{fork:12, merge:89, support:412}, ur:{}, wi:false, img:null },
  { id:'c4', userId:'taylor', branch:'main',                   message:'Paid off student loans',                             body:"Took 6 years but we're finally here. $48k gone. Immediately opened a brokerage account.",               category:'Finance',       ts:'1d ago',  rx:{fork:5,  merge:201,support:678}, ur:{}, wi:false, img:'https://picsum.photos/seed/finance1/600/280' },
  { id:'c5', userId:'jordan', branch:'what-if/phd-cs',         message:'What if I went back for a PhD in CS?',               body:'Applied to 3 programs. Pros: research freedom. Cons: 5 years on a stipend.',                           category:'Education',     ts:'1d ago',  rx:{fork:54, merge:18, support:92 }, ur:{}, wi:true,  img:null },
  { id:'c6', userId:'maya',   branch:'main',                   message:'Moved in with partner after 2 years of dating',      body:null,                                                                                                    category:'Relationships', ts:'2d ago',  rx:{fork:23, merge:189,support:534}, ur:{}, wi:false, img:'https://picsum.photos/seed/home22/600/280' },
  { id:'c7', userId:'sam',    branch:'what-if/house-purchase', message:'What if I bought a house in the suburbs?',           body:'Rates are high, but renting feels like burning money. Ran the 5-year break-even calc.',                 category:'Housing',       ts:'3d ago',  rx:{fork:71, merge:44, support:98 }, ur:{}, wi:true,  img:'https://picsum.photos/seed/house9/600/280' },
  { id:'c8', userId:'taylor', branch:'what-if/career-switch',  message:'What if I switched to product management?',          body:'Have the technical skills. Not sure I want the politics. But the pay bump is real.',                    category:'Career',        ts:'3d ago',  rx:{fork:93, merge:37, support:141}, ur:{}, wi:true,  img:null },
];

export const MY_TIMELINE = [
  { id:'m1', branch:'main',       message:'Joined Series A startup as lead engineer',  category:'Career',    date:'Apr 2026', wi:false, merged:false },
  { id:'m2', branch:'main',       message:'Relocated to San Francisco',                category:'Housing',   date:'Jan 2026', wi:false, merged:false },
  { id:'m3', branch:'wi-startup', message:'What if I co-founded my own startup?',      category:'Career',    date:'Jan 2026', wi:true,  merged:false },
  { id:'m4', branch:'main',       message:'Ran first marathon — finished in 3:47',     category:'Health',    date:'Oct 2025', wi:false, merged:false },
  { id:'m5', branch:'wi-phd',     message:'What if I pursued a CS PhD instead?',       category:'Education', date:'Sep 2025', wi:true,  merged:true  },
  { id:'m6', branch:'main',       message:'Left grad school, joined industry',          category:'Career',    date:'Jun 2025', wi:false, merged:false },
  { id:'m7', branch:'wi-nyc',     message:'What if I moved to New York instead?',      category:'Housing',   date:'Mar 2025', wi:true,  merged:false },
  { id:'m8', branch:'main',       message:'Started learning Japanese (N5 → N4)',       category:'Education', date:'Feb 2025', wi:false, merged:false },
  { id:'m9', branch:'main',       message:"Moved out of parents' home",                category:'Housing',   date:'Aug 2024', wi:false, merged:false },
];

export const WEEK_DATA = [
  [0,1,0,2,0,1,0],[1,0,3,1,0,2,1],[0,2,1,0,1,0,2],[1,1,0,3,1,2,0],
  [0,0,2,1,0,1,0],[2,1,0,0,3,1,2],[0,1,1,2,0,0,1],[1,0,2,1,1,3,0],
  [0,2,0,1,0,1,0],[3,1,2,0,1,0,2],[1,0,1,2,0,3,1],[0,1,0,0,2,1,0],
  [2,0,3,1,0,2,0],[1,2,0,1,1,0,3],[0,1,2,0,1,2,1],[2,0,1,3,0,1,0],
  [1,1,0,2,1,0,2],[0,3,1,0,2,1,0],[1,0,2,1,0,3,2],[0,1,0,2,1,0,1],
];
export const WEEK_MONTHS = ['Dec','Dec','Dec','Jan','Jan','Jan','Jan','Feb','Feb','Feb','Mar','Mar','Mar','Mar','Apr','Apr','Apr','Apr','Apr','Apr'];
export const DAY_LABELS  = ['M','','W','','F','',''];
export const CELL_COLORS = ['oklch(93% 0.04 260)','oklch(80% 0.1 260)','oklch(68% 0.15 260)','oklch(58% 0.18 260)','oklch(52% 0.2 260)'];
export const totalCommits = WEEK_DATA.flat().reduce((a,b)=>a+b,0);
export const GRAPH_START = new Date(2025, 11, 10);

export const ALL_USERS = {
  ...USERS,
  priya: { id:'priya', name:'Priya Sharma',   handle:'@priya.sharma',   ini:'PS', color:'oklch(58% 0.2 40)',   bio:'Architect. Slow traveler. Dog person.',    commits:34, branches:4, followers:890,  following:120 },
  luca:  { id:'luca',  name:'Luca Ferretti',  handle:'@luca.ferretti',  ini:'LF', color:'oklch(50% 0.18 230)', bio:'Writer. Ex-lawyer. Figuring it out.',      commits:19, branches:6, followers:654,  following:88  },
  sofia: { id:'sofia', name:'Sofia Andersen', handle:'@sofia.andersen', ini:'SA', color:'oklch(52% 0.18 160)', bio:'Product manager. Marathon runner.',         commits:61, branches:8, followers:1780, following:203 },
};

export const EXPLORE_COMMITS = [
  ...INIT_FEED,
  { id:'e1', userId:'priya', branch:'main',               message:'Quit architecture firm to go independent',    body:'7 years, 3 promotions. But I wanted to design things I believed in. Took the leap last Friday.',  category:'Career',    ts:'5h ago',  rx:{fork:201,merge:134,support:512}, ur:{}, wi:false },
  { id:'e2', userId:'sofia', branch:'main',               message:'Adopted a dog — best commit I ever made',     body:null,                                                                                              category:'Health',    ts:'8h ago',  rx:{fork:18, merge:445,support:891}, ur:{}, wi:false },
  { id:'e3', userId:'luca',  branch:'what-if/leave-city', message:'What if I moved to a small town for 2 years?',body:'Cheaper, quieter, more creative. But my whole network is here. 50/50.',                          category:'Housing',   ts:'12h ago', rx:{fork:178,merge:62, support:241}, ur:{}, wi:true  },
  { id:'e4', userId:'priya', branch:'what-if/sabbatical', message:'What if I took a 6-month unpaid sabbatical?', body:'Have the savings. Have the ideas. Just need the courage to pull the trigger.',                    category:'Career',    ts:'1d ago',  rx:{fork:234,merge:88, support:390}, ur:{}, wi:true  },
  { id:'e5', userId:'sofia', branch:'main',               message:'Negotiated a 32-hour work week',              body:'Took 3 months and a competing offer. Worth every awkward conversation.',                          category:'Career',    ts:'2d ago',  rx:{fork:89, merge:312,support:674}, ur:{}, wi:false },
  { id:'e6', userId:'luca',  branch:'main',               message:'Published first essay — 40k reads',           body:null,                                                                                              category:'Education', ts:'2d ago',  rx:{fork:34, merge:156,support:423}, ur:{}, wi:false },
  { id:'e7', userId:'taylor',branch:'what-if/freelance',  message:'What if I freelanced instead of full-time?',  body:'Better pay, more autonomy. Worse benefits. Running the math.',                                    category:'Finance',   ts:'3d ago',  rx:{fork:112,merge:44, support:189}, ur:{}, wi:true  },
  { id:'e8', userId:'maya',  branch:'what-if/cofounder',  message:'What if I joined a startup as a cofounder?',  body:'The team is solid. The idea is risky. Equity vs salary feels like a coin flip right now.',          category:'Career',    ts:'4d ago',  rx:{fork:167,merge:55, support:290}, ur:{}, wi:true  },
];

export const TRENDING = [...EXPLORE_COMMITS].sort((a,b)=>(b.rx.fork+b.rx.merge+b.rx.support)-(a.rx.fork+a.rx.merge+a.rx.support));
export const WHATIFS  = [...EXPLORE_COMMITS].filter(c=>c.wi).sort((a,b)=>b.rx.fork-a.rx.fork);

export const SUGGESTED_PEOPLE = [
  { ...ALL_USERS.priya, mutual:2,  followed:false },
  { ...ALL_USERS.sofia, mutual:5,  followed:false },
  { ...ALL_USERS.luca,  mutual:1,  followed:false },
  { ...USERS.jordan,    mutual:12, followed:true  },
  { ...USERS.taylor,    mutual:8,  followed:true  },
];

export const NOTIF_DATA = [
  { id:'n1', type:'fork',    userId:'priya',  message:'forked your commit', commit:'Joined Series A startup as lead engineer', ts:'2m ago',  unread:true  },
  { id:'n2', type:'support', userId:'sofia',  message:'supported your commit', commit:'Ran first marathon — finished in 3:47',   ts:'15m ago', unread:true  },
  { id:'n3', type:'follow',  userId:'luca',   message:'started following you', commit:null,                                        ts:'1h ago',  unread:true  },
  { id:'n4', type:'merge',   userId:'jordan', message:'merged your decision', commit:'Relocated to San Francisco',                ts:'2h ago',  unread:false },
  { id:'n5', type:'fork',    userId:'taylor', message:'forked your what-if', commit:'What if I co-founded my own startup?',       ts:'3h ago',  unread:false },
  { id:'n6', type:'support', userId:'maya',   message:'supported your commit', commit:'Left grad school, joined industry',         ts:'5h ago',  unread:false },
  { id:'n7', type:'follow',  userId:'sam',    message:'started following you', commit:null,                                        ts:'1d ago',  unread:false },
  { id:'n8', type:'merge',   userId:'priya',  message:'merged your decision', commit:'Started learning Japanese (N5 → N4)',       ts:'1d ago',  unread:false },
  { id:'n9', type:'fork',    userId:'sofia',  message:'forked your what-if',  commit:'What if I moved to New York instead?',      ts:'2d ago',  unread:false },
];

export const CONVOS = [
  { id:'cv1', userId:'jordan', lastMsg:'Dude that freelance jump was terrifying but so worth it', ts:'2m',  unread:3 },
  { id:'cv2', userId:'maya',   lastMsg:'Did you see that Lisbon what-if I posted?',               ts:'1h',  unread:1 },
  { id:'cv3', userId:'taylor', lastMsg:'How did you negotiate the 4-day week?',                   ts:'3h',  unread:0 },
  { id:'cv4', userId:'sam',    lastMsg:'Congrats on the marathon! Insane time 🏃',                ts:'1d',  unread:0 },
];

export const THREAD_MSGS = {
  cv1: [
    { id:'m1', from:'jordan', text:'Bro I saw you quit your job. How are you feeling??', ts:'10:02 AM' },
    { id:'m2', from:'alex',   text:"Honestly terrified. But also the most alive I've felt in years.", ts:'10:05 AM' },
    { id:'m3', from:'jordan', text:'That\'s exactly how I felt. Give it 3 months.', ts:'10:06 AM' },
    { id:'m4', from:'alex',   text:'Did you have clients lined up before you quit?', ts:'10:08 AM' },
    { id:'m5', from:'jordan', text:'Two warm leads. Enough to survive the first month.', ts:'10:09 AM' },
    { id:'m6', from:'jordan', text:'Dude that freelance jump was terrifying but so worth it', ts:'10:11 AM', sharedCommit: { message:'Quit corporate job to freelance full-time', branch:'main', category:'Career', userId:'jordan' } },
  ],
  cv2: [
    { id:'m1', from:'alex',   text:'Your Lisbon what-if post got so many forks!', ts:'Yesterday' },
    { id:'m2', from:'maya',   text:'I know right! Makes me want to actually do it.', ts:'Yesterday' },
    { id:'m3', from:'maya',   text:'Did you see that Lisbon what-if I posted?', ts:'Yesterday' },
  ],
  cv3: [
    { id:'m1', from:'taylor', text:'How did you negotiate the 4-day week?', ts:'3h ago' },
  ],
  cv4: [
    { id:'m1', from:'sam',    text:'Congrats on the marathon! Insane time 🏃', ts:'Yesterday' },
  ],
};

export const fmt = n => n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n);

export const catColor = cat => {
  const h = {Career:'260',Health:'155',Relationships:'330',Finance:'60',Education:'200',Travel:'25',Housing:'80'}[cat]||'260';
  return { bg:`oklch(93% 0.04 ${h})`, fg:`oklch(40% 0.12 ${h})` };
};

export const branchMeta = id => MY_BRANCHES.find(b=>b.id===id) || { color:'oklch(52% 0.2 260)', name:'main', merged:false };
