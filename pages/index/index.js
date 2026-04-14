const app = getApp();

Page({
  data: {
    activeTab: 'outfit',
    brandList: [],
    buyerShowList: [],
    videoList: [],
    buyerShowLoading: true,
    videoLoading: true,
    globalSearchKeyword: "",
    videoSource: null,
    canViewMy: true
  },

  onLoad: function (options) {
    this.syncPermissions();
    const tab = options && options.tab ? options.tab : '';
    if (tab === 'video' || tab === 'buyerShow' || tab === 'outfit') {
      this.setData({ activeTab: tab });
    }
    this.getBrands();
    if (app.globalData.videoSource !== undefined && app.globalData.videoSource !== null) {
      this.setData({ videoSource: app.globalData.videoSource });
    } else {
      app.videoSourceReadyCallback = (source) => {
        this.setData({ videoSource: source });
        if (this.data.activeTab === 'video') {
          this.getVideosForHome();
        }
      };
    }
    if (this.data.activeTab === 'video') {
      this.getVideosForHome();
    } else if (this.data.activeTab === 'buyerShow') {
      this.getBuyerShowList();
    }
  },

  onShow: function() {
    this.syncPermissions();
    if (this.data.videoSource !== app.globalData.videoSource && app.globalData.videoSource !== null) {
      this.setData({ videoSource: app.globalData.videoSource });
      if (this.data.activeTab === 'video') {
        this.getVideosForHome();
      }
    }
  },

  onTabChange: function(event) {
    const newTab = event.currentTarget.dataset.tab;
    if (newTab === 'my') {
      if (!this.data.canViewMy) {
        wx.showToast({ title: '无权限', icon: 'none' });
        return;
      }
      this.goToPersonalCenter();
      return;
    }
    if (this.data.activeTab === newTab) return;
    this.setData({ activeTab: newTab });

    if (newTab === 'buyerShow' && this.data.buyerShowList.length === 0) {
      this.getBuyerShowList();
    } else if (newTab === 'video' && this.data.videoList.length === 0) {
      this.getVideosForHome();
    }
  },

  getVideosForHome: function () {
    if (this.data.videoSource === null) {
      return;
    }
    this.setData({ videoLoading: true });
    const videoSource = this.data.videoSource;
    let apiUrl = '';
    if (videoSource === 'wechat') {
      apiUrl = 'https://xiaochengxu.uiijii.cn/get_wechat_videos.php';
    } else {
      apiUrl = 'https://xiaochengxu.uiijii.cn/get_video_seasons.php';
    }

    wx.request({
      url: apiUrl,
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const formattedList = res.data.map(item => {
            item.id = item.feedId || item.name;
            return item;
          });
          this.setData({ videoList: formattedList });
        }
      },
      complete: () => {
        this.setData({ videoLoading: false });
      }
    });
  },

  handleVideoCardTap: function (event) {
    const item = event.currentTarget.dataset.item;
    const videoSource = this.data.videoSource;
    if (videoSource === 'wechat') {
      if (!item.feedId) {
        wx.showToast({ title: '视频ID无效', icon: 'none' });
        return;
      }
      wx.openChannelsActivity({
        finderUserName: "sphd3MzWP8YGynB",
        feedId: item.feedId
      });
    } else {
      if (!item.hasContent) {
        wx.showToast({ title: '暂无视频', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: `/pages/video/detail?season=${encodeURIComponent(item.name)}` });
    }
  },

  getBrands: function () {
    wx.request({
      url: 'https://xiaochengxu.uiijii.cn/api.php?action=getBrands',
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({ brandList: res.data });
        }
      }
    });
  },

  goToGroupList: function (event) {
    const brand = event.currentTarget.dataset.item;
    if (!brand || brand.group_count <= 0) {
      wx.showToast({ title: '暂无内容', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/list/list?brand_id=${brand.id}` });
  },

  onGlobalSearchInput: function(e) {
    this.setData({ globalSearchKeyword: e.detail.value });
  },

  onGlobalSearchConfirm: function() {
    const keyword = this.data.globalSearchKeyword.trim();
    if (!keyword) {
      wx.showToast({ title: '请输入关键字', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/search/search?keyword=${encodeURIComponent(keyword)}` });
  },

  // ========= 关键改动：买家秀第一张固定为「朋友圈素材」 =========
  getBuyerShowList: function() {
    this.setData({ buyerShowLoading: true });
    wx.request({
      url: 'https://xiaochengxu.uiijii.cn/get_shows.php',
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          let list = res.data || [];
          // 固定插入朋友圈素材卡片到最前
          const momentsCard = {
            name: '一键发圈',
            path: '/pages/socialFeed/list',
            icon: '/assets/icons/moments.png', // 请确保此文件存在
            fixed: true,
            hasContent: true
          };
          list.unshift(momentsCard);
          this.setData({ buyerShowList: list });
        }
      },
      complete: () => {
        this.setData({ buyerShowLoading: false });
      }
    });
  },

  // 买家秀卡片点击
  goToSubList: function(event) {
    const item = event.currentTarget.dataset.item;
    // 朋友圈素材：固定跳转到素材列表
    if (item && item.fixed) {
      wx.navigateTo({ url: item.path });
      return;
    }
    if (!item || !item.hasContent) {
      wx.showToast({ title: '暂无内容', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/show/sublist/sublist?season=${item.path}` });
  },

  onShareAppMessage: function () {
    return {
      title: 'UIIJII&ENNO图册',
      path: '/pages/index/index',
      imageUrl: '/assets/icons/share_cover.png'
    };
  },

  onShareTimeline: function () {
    return {
      title: 'UIIJII&ENNO 新款图册，快来看看吧！',
      query: ''
    };
  },

  goToPersonalCenter: function() {
    wx.redirectTo({
      url: '/pages/home/home'
    });
  },

  syncPermissions() {
    const permissions = app.globalData.permissions || wx.getStorageSync('permissions') || {};
    const canViewMy = permissions.can_view_my !== false;
    if (this.data.canViewMy !== canViewMy) {
      this.setData({ canViewMy });
    }
  },

  handleChannelsTap: function(event) {
    const account = event.currentTarget.dataset.account;
    const accounts = {
      uiijii: 'sphd3MzWP8YGynB',
      enno: 'sphCaP3mZxjHlOt'
    };
    const finderUserName = accounts[account];
    if (!finderUserName) {
      wx.showToast({ title: 'ID配置错误', icon: 'none' });
      return;
    }
    wx.openChannelsUserProfile({
      finderUserName,
      fail: () => {
        wx.showToast({ title: '打开失败', icon: 'none' });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({ globalSearchKeyword: '' });
    this.getBrands();
    if (this.data.activeTab === 'buyerShow') {
      this.getBuyerShowList();
    } else if (this.data.activeTab === 'video') {
      this.getVideosForHome();
    }
    wx.stopPullDownRefresh();
  }
});
