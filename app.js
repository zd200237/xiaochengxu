App({
  globalData: {
    token: null,
    agentInfo: null,
    permissions: null,
    isLoggedIn: false, // 统一的登录状态标志
    isRedirectingToLogin: false
  },

  onLaunch(options) {
    // 小程序启动时只加载本地缓存
    this.checkLoginStatus().then((isLoggedIn) => {
      if (!isLoggedIn) {
        const launchPath = this.buildPathFromOptions(options);
        this.redirectToLogin({ fromLaunch: true, redirectPath: launchPath });
      }
    });
    this.setupLoginGuard();
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
      const permissions = wx.getStorageSync('permissions');
      if (token && agentInfo) {
        console.log('[App] 本地缓存中找到Token，直接登录（不校验服务器）');
        this.globalData.token = token;
        this.globalData.agentInfo = agentInfo;
        this.globalData.permissions = permissions || { can_view_my: true };
        this.globalData.isLoggedIn = true;
        resolve(true);
      } else {
        console.log('[App] 本地无Token，需要登录');
        this.globalData.permissions = null;
        this.globalData.isLoggedIn = false;
        resolve(false);
      }
    });
  },

  // 全局退出登录
  logout() {
    this.globalData.token = null;
    this.globalData.agentInfo = null;
    this.globalData.permissions = null;
    this.globalData.isLoggedIn = false;
    wx.removeStorageSync('token');
    wx.removeStorageSync('agent_info');
    wx.removeStorageSync('permissions');
  },

  setupLoginGuard() {
    if (this._loginGuardInited || !wx.onAppRoute) {
      return;
    }
    this._loginGuardInited = true;
    wx.onAppRoute((route) => {
      const routePath = this.buildPathFromRoute(route);
      if (this.isLoginRoute(routePath)) {
        return;
      }
      this.checkLoginStatus().then((isLoggedIn) => {
        if (!isLoggedIn) {
          this.redirectToLogin({ fromLaunch: false, redirectPath: routePath });
        }
      });
    });
  },

  isLoginRoute(routePath) {
    return routePath && routePath.startsWith('/pages/login/index');
  },

  redirectToLogin({ fromLaunch, redirectPath }) {
    if (this.globalData.isRedirectingToLogin) {
      return;
    }
    const currentPages = getCurrentPages();
    const currentRoute = currentPages.length ? `/${currentPages[currentPages.length - 1].route}` : '';
    if (this.isLoginRoute(currentRoute)) {
      return;
    }
    this.globalData.isRedirectingToLogin = true;
    const safeRedirectPath = redirectPath && !this.isLoginRoute(redirectPath) ? redirectPath : '';
    const url = safeRedirectPath
      ? `/pages/login/index?redirect=${encodeURIComponent(safeRedirectPath)}`
      : '/pages/login/index';
    const nav = fromLaunch ? wx.reLaunch : wx.redirectTo;
    nav({
      url,
      complete: () => {
        this.globalData.isRedirectingToLogin = false;
      }
    });
  },

  buildPathFromRoute(route) {
    if (!route) {
      return '';
    }
    const path = route.path || route.route || '';
    const query = route.query || {};
    return this.buildPathWithQuery(path, query);
  },

  buildPathFromOptions(options) {
    if (!options || !options.path) {
      return '';
    }
    return this.buildPathWithQuery(options.path, options.query || {});
  },

  buildPathWithQuery(path, query) {
    if (!path) {
      return '';
    }
    const queryString = Object.keys(query)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
      .join('&');
    return `/${path}${queryString ? `?${queryString}` : ''}`;
  }
});
