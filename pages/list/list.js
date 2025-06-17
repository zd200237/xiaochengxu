// pages/list/list.js
Page({
  data: {
    groupList: [],
    originalGroupList: [],
    leftColumnList: [],
    rightColumnList: [],
    brandId: null,
    searchKeyword: '',
    leftColumnHeight: 0,
    rightColumnHeight: 0
  },

  onLoad: function (options) {
    const brandId = options.brand_id;
    this.setData({ brandId: brandId });
    if (brandId) {
      this.fetchData(`https://xiaochengxu.uiijii.cn/api.php?action=getProductGroups&brand_id=${brandId}`, true);
    }
  },

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
          // 重新分配瀑布流
          that.distributeToColumns(res.data);
          if (!isInitialLoad && res.data.length === 0) {
            wx.showToast({ title: '没有找到相关商品', icon: 'none' });
          }
        }
      },
      fail: () => { wx.showToast({ title: '请求失败', icon: 'error' }); },
      complete: () => { wx.hideLoading(); }
    });
  },

  // ✨✨✨ 瀑布流分配逻辑 ✨✨✨
  distributeToColumns: function(dataList) {
    const leftColumn = [];
    const rightColumn = [];
    let leftHeight = 0;
    let rightHeight = 0;

    dataList.forEach((item, index) => {
      // 计算每个item的预估高度
      const estimatedHeight = this.calculateItemHeight(item);
      
      // 将item放到高度较小的列中
      if (leftHeight <= rightHeight) {
        leftColumn.push(item);
        leftHeight += estimatedHeight;
      } else {
        rightColumn.push(item);
        rightHeight += estimatedHeight;
      }
    });

    this.setData({
      leftColumnList: leftColumn,
      rightColumnList: rightColumn,
      leftColumnHeight: leftHeight,
      rightColumnHeight: rightHeight
    });
  },

  // ✨✨✨ 预估item高度的辅助函数 ✨✨✨
  calculateItemHeight: function(item) {
    // 基础高度：图片区域 + padding
    let baseHeight = 200; // 预估图片高度
    
    // 根据商品数量计算info区域高度
    if (item.products && item.products.length > 0) {
      // 每个product大约占用60rpx高度
      baseHeight += item.products.length * 60;
    }
    
    // 根据商品名称长度微调（长名称可能换行）
    if (item.products) {
      item.products.forEach(product => {
        if (product.name && product.name.length > 10) {
          baseHeight += 20; // 长名称可能多占一行
        }
      });
    }
    
    return baseHeight;
  },

  onSearchInput: function(e) { 
    this.setData({ searchKeyword: e.detail.value }); 
  },

  onSearchConfirm: function() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) { 
      this.onClearSearch(); 
      return; 
    }
    const apiUrl = `https://xiaochengxu.uiijii.cn/api.php?action=search&brand_id=${this.data.brandId}&keyword=${keyword}`;
    this.fetchData(apiUrl);
  },

  onClearSearch: function() {
    this.setData({ searchKeyword: '' });
    // 恢复原始数据并重新分配瀑布流
    this.distributeToColumns(this.data.originalGroupList);
  },

  goToDetail: function (event) {
    const groupId = event.currentTarget.dataset.groupid;
    wx.navigateTo({ url: '/pages/detail/detail?group_id=' + groupId });
  }
})