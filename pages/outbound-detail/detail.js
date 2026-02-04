// pages/outbound-detail/detail.js （带三级页面跳转功能）

Page({
  data: {
    order: {},
    source: '',
  },

  onLoad(options) {
    if (options && options.source) {
      this.setData({ source: options.source });
      wx.setNavigationBarTitle({
        title: `出库单 ${options.source}` // 标题可以更明确
      });
      this.fetchOrderDetail();
    } else {
      wx.showModal({
        title: '错误',
        content: '无法获取订单号，请返回重试。',
        showCancel: false,
        confirmText: '返回',
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  fetchOrderDetail() {
    wx.showLoading({ title: '加载中...' });
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.hideLoading();
      wx.showModal({
        title: '提示',
        content: '您尚未登录或登录已过期，请重新登录。',
        showCancel: false,
        confirmText: '去登录',
        success: () => {
          wx.redirectTo({ url: '/pages/login/index' });
        }
      });
      return;
    }
    wx.request({
      url: 'https://bojun.uiijii.cn/api/get_outbound_order_detail.php',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      },
      data: {
        source: this.data.source
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            order: res.data
          });
        } else {
          const errorData = res.data;
          wx.showToast({ title: errorData.message || '加载订单详情失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 新增：点击款号卡片跳转到SKU详情页
   */
  goToSkuDetail(event) {
    const kuanhao = event.currentTarget.dataset.kuanhao;
    const source = this.data.source;
    if (source && kuanhao) {
      wx.navigateTo({
        // 跳转到出库单的SKU详情页
        url: `/pages/outbound-sku-detail/detail?source=${source}&kuanhao=${kuanhao}`
      });
    }
  }
});
