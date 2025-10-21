App({
  globalData: {
    token: null,
    agentInfo: null,
    isLoggedIn: false // 统一的登录状态标志
  },

  onLaunch() {
    // 小程序启动时只加载本地缓存，不做跳转
    this.checkLoginStatus();
  },

  // 只用本地缓存判断登录，无需和服务器校验
  checkLoginStatus() {
    return new Promise((resolve) => {
      // 1. 用内存（全局变量）判断
      if (this.globalData.token && this.globalData.isLoggedIn) {
        console.log('[App] 内存中存在Token，视为已登录');
        resolve(true);
        return;
      }

      // 2. 用本地缓存判断
      const token = wx.getStorageSync('token');
      const agentInfo = wx.getStorageSync('agent_info');
      if (token && agentInfo) {
        console.log('[App] 本地缓存中找到Token，直接登录（不校验服务器）');
        this.globalData.token = token;
        this.globalData.agentInfo = agentInfo;
        this.globalData.isLoggedIn = true;
        resolve(true);
      } else {
        console.log('[App] 本地无Token，需要登录');
        this.globalData.isLoggedIn = false;
        resolve(false);
      }
    });
  },

  // 全局退出登录
  logout() {
    this.globalData.token = null;
    this.globalData.agentInfo = null;
    this.globalData.isLoggedIn = false;
    wx.removeStorageSync('token');
    wx.removeStorageSync('agent_info');
  }
});
