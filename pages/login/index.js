Page({
  data: {
    loginType: 'wechat',
    username: '',
    password: '',
    loading: false,
    errorMsg: '',
    showAccount: false,
    redirectUrl: '',
    showApply: false,
    stockinfoId: '',
    applyInfo: null,
    applyLoading: false,
    applyError: ''
  },

  onLoad(options) {
    if (options && options.redirect) {
      this.setData({ redirectUrl: decodeURIComponent(options.redirect) });
    }
    this.silentLogin();
  },

  // 静默微信登录
  silentLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.request({
            url: 'https://bojun.uiijii.cn/api/login.php',
            method: 'POST',
            data: {
              loginType: 'silent',
              code: res.code
            },
            success: (response) => {
              if (response.data.code === 0) {
                this.loginSuccess(response.data);
              }
              // code !== 0 不弹窗，静默无感
            }
          });
        }
      }
    });
  },

  // 微信一键登录（手机号授权）
  onGetPhoneNumber(e) {
    if (e.detail.code) {
      this.setData({ loading: true, errorMsg: '' });
      wx.login({
        success: (loginRes) => {
          this.performWechatLogin(loginRes.code, e.detail.code);
        },
        fail: () => {
          wx.showToast({ title: '微信登录失败', icon: 'none', duration: 2000 });
          this.setData({ loading: false });
        }
      });
    } else {
      wx.showToast({ title: '获取手机号失败，请重试', icon: 'none', duration: 2000 });
    }
  },

  performWechatLogin(loginCode, phoneCode) {
    wx.request({
      url: 'https://bojun.uiijii.cn/api/login.php',
      method: 'POST',
      data: {
        loginType: 'wechat',
        code: loginCode,
        phoneCode: phoneCode
      },
      success: (response) => {
        this.setData({ loading: false });
        if (response.data.code === 0) {
          this.loginSuccess(response.data);
        } else if (response.data.code === 1001) {
          this.openApplyModal(response.data.apply_info);
        } else if (response.data.code === 1002) {
          wx.showToast({ title: response.data.message || '审核中，请等待管理员审批', icon: 'none', duration: 2000 });
        } else if (response.data.code === 1003) {
          wx.showToast({ title: response.data.message || '无权限，请联系管理员', icon: 'none', duration: 2000 });
        } else {
          // 关键行，显示后端 message（比如手机号不存在等）
          wx.showToast({
            title: response.data.message || '手机号不一致，请联系您的销售代表',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({
          title: '网络请求失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 显示账号登录弹窗
  showAccountLogin() {
    this.setData({ showAccount: true });
  },
  closeAccountLogin() {
    this.setData({ showAccount: false, errorMsg: '', username: '', password: '' });
  },

  openApplyModal(applyInfo) {
    this.setData({
      showApply: true,
      stockinfoId: '',
      applyInfo: applyInfo || null,
      applyError: ''
    });
  },

  closeApplyModal() {
    this.setData({
      showApply: false,
      stockinfoId: '',
      applyInfo: null,
      applyError: '',
      applyLoading: false
    });
  },

  onStockinfoInput(e) {
    this.setData({ stockinfoId: e.detail.value, applyError: '' });
  },

  submitApply() {
    const stockinfoId = (this.data.stockinfoId || '').trim();
    const applyInfo = this.data.applyInfo || {};
    if (!stockinfoId) {
      this.setData({ applyError: '请填写客户编号' });
      return;
    }
    if (!applyInfo.openid || !applyInfo.phone) {
      this.setData({ applyError: '申请信息不完整，请重新登录' });
      return;
    }

    this.setData({ applyLoading: true, applyError: '' });
    wx.getUserProfile({
      desc: '用于完善员工资料',
      success: (profileRes) => {
        const nickname = (profileRes.userInfo && profileRes.userInfo.nickName) ? profileRes.userInfo.nickName : '';
        this.doApply(stockinfoId, applyInfo, nickname);
      },
      fail: () => {
        this.doApply(stockinfoId, applyInfo, '');
      }
    });
  },

  doApply(stockinfoId, applyInfo, nickname) {
    wx.request({
      url: 'https://bojun.uiijii.cn/api/user_add.php',
      method: 'POST',
      data: {
        openid: applyInfo.openid,
        phone: applyInfo.phone,
        stockinfo_id: stockinfoId,
        nickname: nickname
      },
      success: (res) => {
        const payload = res.data || {};
        if (payload.code === 0) {
          wx.showToast({ title: payload.message || '申请已提交', icon: 'none', duration: 2000 });
          this.closeApplyModal();
        } else if (payload.code === 1002) {
          wx.showToast({ title: payload.message || '审核中，请等待管理员审批', icon: 'none', duration: 2000 });
        } else if (payload.code === 1003) {
          wx.showToast({ title: payload.message || '无权限，请联系管理员', icon: 'none', duration: 2000 });
        } else {
          wx.showToast({ title: payload.message || '提交失败，请重试', icon: 'none', duration: 2000 });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败，请重试', icon: 'none', duration: 2000 });
      },
      complete: () => {
        this.setData({ applyLoading: false });
      }
    });
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value, errorMsg: '' });
  },
  onPasswordInput(e) {
    this.setData({ password: e.detail.value, errorMsg: '' });
  },

  // 账号密码登录
  accountLogin() {
    if (!this.data.username || !this.data.password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none', duration: 2000 });
      return;
    }
    this.setData({ loading: true, errorMsg: '' });
    wx.login({
      success: (res) => {
        wx.request({
          url: 'https://bojun.uiijii.cn/api/login.php',
          method: 'POST',
          data: {
            loginType: 'account',
            code: res.code,
            username: this.data.username,
            password: this.data.password
          },
          success: (response) => {
            this.setData({ loading: false });
            if (response.data.code === 0) {
              this.closeAccountLogin();
              this.loginSuccess(response.data);
            } else {
              wx.showToast({
                title: response.data.message || '账号或密码错误',
                icon: 'none',
                duration: 2000
              });
            }
          },
          fail: () => {
            this.setData({ loading: false });
            wx.showToast({
              title: '网络请求失败，请重试',
              icon: 'none',
              duration: 2000
            });
          }
        });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '获取登录凭证失败', icon: 'none', duration: 2000 });
      }
    });
  },

  // 登录成功统一跳转
  loginSuccess(data) {
    const app = getApp();
    const permissions = data.permissions || { can_view_my: true };
    wx.setStorageSync('token', data.token);
    wx.setStorageSync('agent_info', data.agent_info);
    wx.setStorageSync('permissions', permissions);
    app.globalData.token = data.token;
    app.globalData.agentInfo = data.agent_info;
    app.globalData.permissions = permissions;
    app.globalData.isLoggedIn = true;

    wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 });
    setTimeout(() => {
      const redirectUrl = this.data.redirectUrl;
      const canViewMy = permissions.can_view_my !== false;
      let targetUrl = redirectUrl;
      if (!targetUrl || targetUrl === '/pages/login/index') {
        targetUrl = canViewMy ? '/pages/home/home' : '/pages/index/index';
      } else if (!canViewMy && targetUrl.startsWith('/pages/home/home')) {
        targetUrl = '/pages/index/index';
      }
      wx.reLaunch({ url: targetUrl });
    }, 1500);
  }
});
