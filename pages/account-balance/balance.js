// pages/account-balance/balance.js (最终过滤版)
Page({
  data: {
    balanceList: [],
    isLoading: true,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '我的账户' });
    this.fetchBalanceData();
  },

  fetchBalanceData() {
    this.setData({ isLoading: true });
    const token = wx.getStorageSync('token');
    const agentInfo = wx.getStorageSync('agent_info');

    if (!token || !agentInfo || !agentInfo.stockinfo_id) {
      wx.redirectTo({ url: '/pages/index/login' });
      return;
    }

    wx.request({
      url: 'https://bojun.uiijii.cn/api/get_account_balance.php',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      data: { stockinfo_id: agentInfo.stockinfo_id },
      success: (res) => {
        if (res.statusCode === 200 && typeof res.data === 'object' && Array.isArray(res.data.data)) {
          const apiData = res.data;
          
          // ===================================================================
          //  !!! 核心修改：过滤掉余额为 0.00 的记录 !!!
          // ===================================================================
          const filteredList = apiData.data.filter(item => parseFloat(item.balance) !== 0);
          // ===================================================================
          
          // 排序逻辑保持不变
          const sortedList = filteredList.sort((a, b) => {
            if (a.account_name === '货款') return -1;
            if (b.account_name === '货款') return 1;
            return a.account_name.localeCompare(b.account_name); 
          });
          
          this.setData({ balanceList: sortedList });

        }
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  }
});