Page({
  data: {
    loginType: 'wechat',
    username: '',
    password: '',
    loading: false,
    errorMsg: '',
    showAccount: false
  },

  onLoad() {
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

  // 登录成功统一跳转 home
  loginSuccess(data) {
    const app = getApp();
    wx.setStorageSync('token', data.token);
    wx.setStorageSync('agent_info', data.agent_info);
    app.globalData.token = data.token;
    app.globalData.agentInfo = data.agent_info;
    app.globalData.isLoggedIn = true;

    wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 });
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/home/home' });
    }, 1500);
  }
});
