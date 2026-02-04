// pages/order-list/list.js

Page({
  data: {
    orderList: [],
    page: 1,
    isLoading: false,
    noMoreData: false,
    total: 0,
  },

  onLoad() {
    this.fetchOrderData();
  },

  onReachBottom() {
    if (this.data.noMoreData || this.data.isLoading) {
      return;
    }
    this.fetchOrderData(true);
  },

  fetchOrderData(isLoadMore = false) {
    this.setData({ isLoading: true });

    const token = wx.getStorageSync('token');
    const agentInfo = wx.getStorageSync('agent_info');

    if (!token || !agentInfo || !agentInfo.stockinfo_id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.redirectTo({ url: '/pages/login/index' });
      return;
    }

    const currentPage = isLoadMore ? this.data.page + 1 : 1;

    wx.request({
      url: 'https://bojun.uiijii.cn/api/get_refund_orders.php', // <<<--- 您的API地址
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      },
      data: {
        stockinfo_id: agentInfo.stockinfo_id,
        page: currentPage
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const apiData = res.data;
          if (apiData && Array.isArray(apiData.data)) {
            const newList = apiData.data;
            const pagination = apiData.pagination;
            const totalRecords = pagination ? pagination.total : 0;
            const newOrderList = isLoadMore ? [...this.data.orderList, ...newList] : newList;
            this.setData({
              orderList: newOrderList,
              page: pagination ? pagination.current_page : this.data.page,
              total: totalRecords,
              noMoreData: newOrderList.length >= totalRecords
            });
          } else {
            wx.showToast({ title: '返回数据格式错误', icon: 'none' });
          }
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  /**
   * 点击卡片跳转到详情页
   */
  goToDetail(event) {
    // 从被点击的组件的 data- 属性中获取订单号
    const source = event.currentTarget.dataset.source;
    if (source) {
      // 使用 wx.navigateTo 跳转到新页面
      wx.navigateTo({
        // 将订单号作为URL参数传递给详情页
        url: `/pages/refund-detail/detail?source=${source}`
      });
    }
  }
});
