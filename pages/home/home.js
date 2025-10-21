// pages/home/home.js

const app = getApp();

Page({
  data: {
    agentInfo: null,
    canShow: false
  },

  onShow() {
    this.checkLogin();
  },

  async checkLogin() {
    const isLoggedIn = await app.checkLoginStatus();
    if (isLoggedIn) {
      this.setData({
        agentInfo: app.globalData.agentInfo,
        canShow: true
      });
    } else {
      // 如果未登录，跳转至登录页面
      wx.redirectTo({ url: '/pages/login/index?from=home' });
    }
  },

  // 菜单跳转
  goToPage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url });
    }
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          wx.redirectTo({ url: '/pages/login/index' });
        }
      }
    });
  }
});
