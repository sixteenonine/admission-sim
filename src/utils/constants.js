export const AVATARS = [
  { id: 1, color: '#3b82f6' }, { id: 2, color: '#10b981' }, 
  { id: 3, color: '#8b5cf6' }, { id: 4, color: '#f43f5e' }, 
  { id: 5, color: '#f97316' }, { id: 6, color: '#14b8a6' }
];

export const MODES = {
  full: { label: 'ALL PARTS (90m)', time: 90 * 60, partPrefix: 'all' },
  part1: { label: 'LISTENING (14m)', time: 14 * 60, partPrefix: 'I. Listening & Speaking' },
  part2: { label: 'READING (46m)', time: 46 * 60, partPrefix: 'II. Reading Skill' },
  part3: { label: 'WRITING (25m)', time: 25 * 60, partPrefix: 'III. Writing Skill' }
};

export const RECOMMENDED_SEQUENCE = [
  { id: '1', part: 'I. Listening & Speaking', label: 'Short Conversation', difficulty: 'medium' },
  { id: '2', part: 'I. Listening & Speaking', label: 'Long Conversation', difficulty: 'medium' },
  { id: '3', part: 'II. Reading Skill', label: 'Advertisement', difficulty: 'easy' },
  { id: '6', part: 'II. Reading Skill', label: 'Visual (Graph/Chart)', difficulty: 'easy' },
  { id: '8', part: 'III. Writing Skill', label: 'Text Completion', difficulty: 'medium' },
  { id: '4', part: 'II. Reading Skill', label: 'Product/Service Review', difficulty: 'medium' },
  { id: '5', part: 'II. Reading Skill', label: 'News Report', difficulty: 'medium' },
  { id: '7', part: 'II. Reading Skill', label: 'General Articles', difficulty: 'hard' },
  { id: '9', part: 'III. Writing Skill', label: 'Paragraph Organization', difficulty: 'medium' },
];

export const EXAM_PARTS = [
  {
    id: 'listening', label: 'Listening & Speaking', max: 20,
    subs: [
      { id: 's1', label: 'Short Conversation', max: 12, range: 'ข้อ 1 - 12' },
      { id: 's2', label: 'Long Conversation', max: 8, range: 'ข้อ 13 - 20' }
    ]
  },
  {
    id: 'reading', label: 'Reading Skill', max: 40,
    subs: [
      { id: 's3', label: 'Advertisement', max: 6, range: 'ข้อ 21 - 26' },
      { id: 's4', label: 'Product/Service Review', max: 6, range: 'ข้อ 27 - 32' },
      { id: 's5', label: 'News Report', max: 6, range: 'ข้อ 33 - 38' },
      { id: 's6', label: 'Visual (Graph/Chart)', max: 6, range: 'ข้อ 39 - 44' },
      { id: 's7', label: 'General Articles', max: 16, range: 'ข้อ 45 - 60' }
    ]
  },
  {
    id: 'writing', label: 'Writing Skill', max: 20,
    subs: [
      { id: 's8', label: 'Text Completion', max: 15, range: 'ข้อ 61 - 75' },
      { id: 's9', label: 'Paragraph Organization', max: 5, range: 'ข้อ 76 - 80' }
    ]
  }
];

export const FLAT_EXAM_SUBS = EXAM_PARTS.flatMap(main => 
  main.subs.map(sub => ({ ...sub, mainLabel: main.label }))
);

export const TECHNIQUE_GUIDES = {
  s1: {
    title: 'Short Conversation',
    tips: [
      'เน้นฟังหรืออ่านให้ออกว่า ใครคุยกับใคร ที่ไหน (Who, Where) เพื่อจับบริบท',
      'ระวัง Idioms (สำนวน) ช้อยส์ที่แปลตรงตัวเป๊ะๆ มักจะเป็นข้อหลอก',
      'คำตอบมักจะซ่อนอยู่ในประโยคตอบกลับ (ประโยคที่ 2) ของบทสนทนา'
    ]
  },
  s2: {
    title: 'Long Conversation',
    tips: [
      'กวาดสายตาอ่านคำถามและช้อยส์ล่วงหน้า (Skimming) เพื่อจับทางว่าเขาจะคุยเรื่องอะไร',
      'จับน้ำเสียง (Tone) และอารมณ์ของคนพูด ว่ากังวล ยินดี หรือกำลังมีปัญหา',
      'ข้อควรรู้: บทสนทนายาวมักจะเริ่มจากการทักทาย -> บอกปัญหา -> เสนอทางแก้ปัญหา'
    ]
  },
  s3: {
    title: 'Advertisement',
    tips: [
      'ห้ามอ่านทุกบรรทัด! ใช้เทคนิค Scanning หาเฉพาะสิ่งที่โจทย์ถาม (ราคา, วันที่, สถานที่)',
      'ระวังคำดอกจัน (*) หรือเงื่อนไขตัวเล็กจิ๋ว (Terms and Conditions) มักเป็นจุดหลอก',
      'โฆษณามักเล่นคำชวนเชื่อ ให้แยกให้ออกว่าอันไหนคือ Fact อันไหนคือการโฆษณาเกินจริง'
    ]
  },
  s4: {
    title: 'Product/Service Review',
    tips: [
      'หา Tone ของรีวิวให้เจอตั้งแต่ประโยคแรก ว่าเป็น Positive (บวก) หรือ Negative (ลบ)',
      'สังเกตคำคุณศัพท์ (Adjectives) ที่ผู้เขียนใช้บรรยายความรู้สึกต่อสินค้า',
      'จับประเด็นให้ได้ว่าผู้เขียน "แนะนำ" (Recommend) ให้ซื้อต่อหรือไม่'
    ]
  },
  s5: {
    title: 'News Report',
    tips: [
      'ใจความสำคัญ (Main Idea) จะอยู่ที่ย่อหน้าแรกเสมอ (Lead Paragraph) ให้อ่านจุดนี้ให้เคลียร์',
      'ใช้หลัก 5W1H (Who, What, Where, When, Why) ในการไล่ล่าหาคำตอบ',
      'ระวังการใช้คำพ้องความหมาย (Synonyms) ช้อยส์มักจะเปลี่ยนคำจากในเนื้อเรื่องเพื่อวัดคลังศัพท์'
    ]
  },
  s6: {
    title: 'Visual (Graph/Chart)',
    tips: [
      'เริ่มที่การอ่านชื่อกราฟ (Title) และป้ายกำกับแกน X, Y เสมอเพื่อเข้าใจภาพรวม',
      'เช็คหน่วย (Units) ให้ชัวร์ เช่น กราฟบอกเป็นหลักพัน (in thousands) หรือเป็น %',
      'ไฮไลต์คำบรรยายแนวโน้ม (Trends) ในโจทย์ เช่น increase (เพิ่ม), plummet (ตกฮวบ), fluctuate (ผันผวน)'
    ]
  },
  s7: {
    title: 'General Articles',
    tips: [
      'ใช้เทคนิค Skimming อ่านประโยคแรกและประโยคสุดท้ายของแต่ละย่อหน้า เพื่อเก็ท Main Idea ไวๆ',
      'ถ้าเจอศัพท์ที่ไม่รู้ ให้เดาความหมายจากบริบทแวดล้อม (Context Clues) อย่าเพิ่งสติแตก',
      'สังเกต Transition words (คำเชื่อม) เช่น However, Therefore มันคือตัวบอกทิศทางของเรื่อง'
    ]
  },
  s8: {
    title: 'Text Completion',
    tips: [
      'เช็ค Grammar บริเวณรอบๆ ช่องว่าง (หน้าและหลังช่องว่าง) เช่น Tense หรือ Subject-Verb Agreement',
      'ดู Part of Speech ให้ชัวร์ว่าจุดนั้นต้องการ Noun, Verb, Adjective หรือ Adverb',
      'สังเกตคำเชื่อม (and, but, or) เพื่อหาทิศทางของความหมาย (คล้อยตาม หรือ ขัดแย้ง)'
    ]
  },
  s9: {
    title: 'Paragraph Organization',
    tips: [
      'หา "ประโยคเปิด" ให้เจอ (ต้องเป็นประโยคใจความกว้างๆ ไม่มี Pronoun ลอยๆ หรือ Linker นำหน้า)',
      'จับคู่ลำดับเวลา (Time Order) และดูความสอดคล้องของคำเชื่อม (Connectors)',
      'เช็ค Pronoun Reference (เช่น He, This, These factors) ว่ามันกำลังอ้างอิงถึงคำนามในประโยคไหน'
    ]
  }
};

export const PACING_RULES = {
  'Short Conversation': { qCount: 12, mins: 8 },
  'Long Conversation': { qCount: 8, mins: 6 },
  'Advertisement': { qCount: 6, mins: 5 },
  'Product/Service Review': { qCount: 6, mins: 6 },
  'News Report': { qCount: 6, mins: 6 },
  'Visual (Graph/Chart)': { qCount: 6, mins: 5 },
  'General Articles': { qCount: 16, mins: 24 },
  'Text Completion': { qCount: 15, mins: 15 },
  'Paragraph Organization': { qCount: 5, mins: 10 },
};

export const UI_CFG = {
  scale: 1, trackRadius: 129, trackStroke: 14, bgTrackStroke: 26,
  depthOuter: 18, depthTrench: 9, depthCap: 9, depthDimple: 3, dimpleSize: 47,
  timeFontSize: 4.6, timeY: 5, labelFontSize: 14, labelY: 6,
  lcdWidth: 304, lcdBezelPadding: 9, lcdHeight: 72, lcdRadiusInner: 20, lcdFontSize: 41,
  btnHeight: 120, btnRadius: 24, btnIconSize: 64, btnFontSize: 13, btnSlopeBlur: 30, btnEdgeBlur: 0,   
  settingBtnScale: 0.5, settingBtnX: -305, settingBtnY: 236,
  gameBtnScale: 0.5, gameBtnX: 1194, gameBtnY: 236,
  refBtnScale: 0.5, refBtnX: 1194, refBtnY: 90,
  techBtnScale: 0.5, techBtnX: -305, techBtnY: 90,
  leftPanelScale: 0.8, leftPanelX: 67, leftPanelY: -41,
  controlPanelScale: 1.05, controlPanelX: 197, controlPanelY: -19,
  rightPanelScale: 0.85, rightPanelX: -112, rightPanelY: -116,
  headerScale: 1, headerX: -269, headerY: 257,
  gameboyScale: 0.75, gameboyX: -17, gameboyY: 130,
  gbBodyWidth: 321, gbBodyHeight: 665, gbBezelHeight: 358, gbScreenWidth: 255, gbScreenHeight: 300,
  gbDpadScale: 1.15, gbDpadX: 6, gbDpadY: 42, gbActionBtnScale: 0.85, gbActionBtnX: 0, gbActionBtnY: -65,
  gbSystemBtnScale: 0.7, gbSystemBtnX: -120, gbSystemBtnY: -200, gbSpeakerScale: 0.75, gbSpeakerX: -25, gbSpeakerY: 11,
  gbLogoScale: 1, gbLogoX: 0, gbLogoY: 0,
  dropRadius: 11, dropShadowBlur: 11, dropShadowSpread: -10,
  refCardMaxWidth: 540, refCardHeight: 0, refRightColWidth: 155, refCardPadding: 24, refCardGap: 12, refItemGap: 11, refLineHeight: 1.1, refIconSize: 17,
  refRightColShadow: 50, refTagShadow: 0,
  refTimeSize: 24, refTimeX: 0, refTimeY: 0,
  refQTextSize: 24, refQTextX: 0, refQTextY: 0,
  refPartSize: 18, refPartX: 0, refPartY: 0,
  refTagSize: 13, refTagX: 0, refTagY: 0,
  refNoteSize: 14, refNoteX: 0, refNoteY: 0,
  refAsteriskSize: 89, refAsteriskX: 0, refAsteriskY: 7,
  refMarkSize: 15, refMarkX: 0, refMarkY: -12,
  spMainTitleGrpX: 0, spMainTitleGrpY: 0, spMainTitleSize: 20, spMainSubSize: 12,
  spInsightTitleX: 0, spInsightTitleY: 0, spInsightTitleSize: 24, spInsightSubX: 0, spInsightSubY: 0, spInsightSubSize: 14, spInsightCardsX: 0, spInsightCardsY: 0,
  spTrendTitleX: 0, spTrendTitleY: 0, spTrendTitleSize: 18, spTrendSubX: 0, spTrendSubY: 0, spTrendSubSize: 11, spTrendInputX: 0, spTrendInputY: 0, spTrendSvgX: 0, spTrendSvgY: 0,
  spBarTitleX: 0, spBarTitleY: 0, spBarTitleSize: 18, spBarSubX: 0, spBarSubY: 0, spBarSubSize: 11, spBarSvgX: 0, spBarSvgY: 0,
  spHeatTitleX: 0, spHeatTitleY: 0, spHeatTitleSize: 18, spHeatSubX: 0, spHeatSubY: 0, spHeatSubSize: 11, spHeatLegX: 0, spHeatLegY: 0, spHeatSvgX: 0, spHeatSvgY: 0,
  spInsightW: 0, spInsightH: 0, spInsightX: 0, spInsightY: 0,
  spInsightPadding: 24, spInsightLabelSize: 13, spInsightValSize: 48, spInsightUnitSize: 14, spInsightDiffSize: 12,
  spTrendContainerW: 0, spTrendContainerH: 0, spTrendX: 0, spTrendY: 0,
  spTrendWidth: 600, spTrendHeight: 240, spTrendPadX: 50, spTrendPadY: 40, spTrendStroke: 3, spTrendDotR: 5, spTrendValSize: 11, spTrendLblSize: 9,
  spBarContainerW: 0, spBarContainerH: 0, spBarX: 0, spBarY: 0,
  spBarWidth: 500, spBarHeight: 140, spBarPadLeft: 75, spBarPadRight: 50, spBarPadTop: 25, spBarPadBot: 15, spBarHeightVal: 22, spBarLblSize: 11, spBarValSize: 11,
  spHeatContainerW: 0, spHeatContainerH: 0, spHeatX: 0, spHeatY: 0,
  spHeatBoxH: 40, spHeatLblW: 110, spHeatLblSize: 10, spHeatValSize: 11,
};