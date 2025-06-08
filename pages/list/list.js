// pages/list/list.js (最终简化版)
Page({
  data: {
    groupList: [],          // 只需要一个列表来展示数据
    originalGroupList: [],  // 用于备份原始数据
    brandId: null,
    searchKeyword: '',
  },

  onLoad: function (options) {
    const brandId = options.brand_id;
    this.setData({ brandId: brandId });
    if (brandId) {
      this.fetchData(`http://xiaochengxu.uiijii.cn/api.php?action=getProductGroups&brand_id=${brandId}`, true);
    }
  },

  // 统一的数据获取函数
  fetchData: function(apiUrl, isInitialLoad = false) {
    const that = this;
    wx.showLoading({ title: isInitialLoad ? '加载中...' : '搜索中...' });
    wx.request({
      url: apiUrl,
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          that.setData({ groupList: res.data });
          if (isInitialLoad) {
            that.setData({ originalGroupList: res.data });
          }
          if (!isInitialLoad && res.data.length === 0) {
            wx.showToast({ title: '没有找到相关商品', icon: 'none' });
          }
        }
      },
      fail: () => { wx.showToast({ title: '请求失败', icon: 'error' }); },
      complete: () => { wx.hideLoading(); }
    });
  },

  onSearchInput: function(e) { this.setData({ searchKeyword: e.detail.value }); },

  onSearchConfirm: function() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) { this.onClearSearch(); return; }
    const apiUrl = `http://xiaochengxu.uiijii.cn/api.php?action=search&brand_id=${this.data.brandId}&keyword=${keyword}`;
    this.fetchData(apiUrl);
  },

  onClearSearch: function() {
    this.setData({
      searchKeyword: '',
      groupList: this.data.originalGroupList
    });
  },

  goToDetail: function (event) {
    const groupId = event.currentTarget.dataset.groupid;
    wx.navigateTo({ url: '/pages/detail/detail?group_id=' + groupId });
  }
})