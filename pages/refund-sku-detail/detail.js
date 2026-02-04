// pages/sku-detail/detail.js （最终修复版）

Page({
  data: {
    source: '',
    kuanhao: '',
    productName: '',
    skuList: [],
  },

  onLoad(options) {
    if (options && options.source && options.kuanhao) {
      this.setData({
        source: options.source,
        kuanhao: options.kuanhao
      });
      wx.setNavigationBarTitle({ title: options.kuanhao });
      this.fetchSkuDetails();
    } else {
      // 增加错误处理
      wx.showModal({
        title: '错误',
        content: '缺少必要的订单信息，请返回重试。',
        showCancel: false,
        confirmText: '返回',
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  fetchSkuDetails() {
    wx.showLoading({ title: '加载中...' });

    // 从本地缓存中获取 Token
    const token = wx.getStorageSync('token');

    // 如果没有Token，引导用户重新登录
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
      url: 'https://bojun.uiijii.cn/api/get_refund_order_sku_details.php',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      },
      data: {
        source: this.data.source,
        kuanhao: this.data.kuanhao
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const apiData = res.data;
          this.setData({
            skuList: apiData.data,
            productName: apiData.data.length > 0 ? apiData.data[0].product_name : ''
          });
        } else {
          const errorData = res.data;
          wx.showToast({ title: errorData.message || '加载明细失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});
