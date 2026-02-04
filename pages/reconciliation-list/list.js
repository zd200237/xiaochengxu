Page({
  data: {
    selectedMonth: '',
    statement: {},
    isLoading: true,
    agentInfo: null,
  },

  onLoad() {
    this.setData({
      selectedMonth: this.getCurrentMonth(),
      agentInfo: wx.getStorageSync('agent_info')
    });
    this.fetchStatementData();
  },

  // 获取当前年月 "2025-09"
  getCurrentMonth() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  },

  /** 月份选择器变动 */
  onMonthChange(event) {
    const newMonth = event.detail.value;
    this.setData({
      selectedMonth: newMonth
    });
    this.fetchStatementData();
  },

  /** 上一月 */
  onPrevMonth() {
    const prevMonth = this.calcPrevMonth(this.data.selectedMonth);
    this.setData({ selectedMonth: prevMonth });
    this.fetchStatementData();
  },

  /** 下一月 */
  onNextMonth() {
    const nextMonth = this.calcNextMonth(this.data.selectedMonth);
    this.setData({ selectedMonth: nextMonth });
    this.fetchStatementData();
  },

  // 计算上一月
  calcPrevMonth(monthStr) {
    let [y, m] = monthStr.split('-').map(Number);
    if (m === 1) { y--; m = 12; } else { m--; }
    return `${y}-${m.toString().padStart(2, '0')}`;
  },

  // 计算下一月
  calcNextMonth(monthStr) {
    let [y, m] = monthStr.split('-').map(Number);
    if (m === 12) { y++; m = 1; } else { m++; }
    return `${y}-${m.toString().padStart(2, '0')}`;
  },

  fetchStatementData() {
    this.setData({ isLoading: true, statement: {} });
    const token = wx.getStorageSync('token');
    if (!token || !this.data.agentInfo) {
      wx.redirectTo({ url: '/pages/login/index' });
      return;
    }
    wx.request({
      url: 'https://bojun.uiijii.cn/api/get_monthly_statement.php',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      data: {
        stockinfo_id: this.data.agentInfo.stockinfo_id,
        month: this.data.selectedMonth
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const apiData = res.data;
          this.setData({ statement: apiData.data });
        }
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  }
});
