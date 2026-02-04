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
      const permissions = app.globalData.permissions || wx.getStorageSync('permissions') || {};
      const canViewMy = permissions.can_view_my !== false;
      if (!canViewMy) {
        wx.showToast({ title: '无权限', icon: 'none' });
        wx.redirectTo({ url: '/pages/index/index' });
        return;
      }
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

  handleTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    if (!tab || tab === 'my') {
      return;
    }
    wx.redirectTo({ url: `/pages/index/index?tab=${tab}` });
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
