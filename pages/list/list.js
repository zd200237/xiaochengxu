// pages/list/list.js

const app = getApp();

Page({
  data: {
    groupList: [],
    originalGroupList: [],
    leftColumnList: [],
    rightColumnList: [],
    brandId: null,
    searchKeyword: '',
    leftColumnHeight: 0,
    rightColumnHeight: 0,
    isLoading: false,
    isSearching: false // 新增：搜索模式标志
  },

  onLoad: function (options) {
    const brandId = options.brand_id;
    this.setData({ brandId: brandId });
    if (brandId) {
      this.fetchProductGroups(`https://xiaochengxu.uiijii.cn/api.php?action=getProductGroups&brand_id=${brandId}`, true);
    }
  },

  // --- 步骤1：获取商品主数据 ---
  fetchProductGroups: function(apiUrl, isInitialLoad = false) {
    this.setData({ isLoading: true });
    wx.request({
      url: apiUrl,
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const productGroups = res.data;
          if (isInitialLoad) {
            this.setData({ originalGroupList: productGroups });
            this.fetchOrderInfoAndMerge(productGroups, false); // 刷新、原始数据
          } else {
            this.fetchOrderInfoAndMerge(productGroups, this.data.isSearching); // 搜索时带标记
          }
        } else {
          this.setData({ isLoading: false });
          wx.showToast({ title: '加载商品失败', icon: 'error' });
        }
      },
      fail: () => {
        this.setData({ isLoading: false });
        wx.showToast({ title: '请求商品接口失败', icon: 'error' });
      }
    });
  },

  // --- 步骤2：获取订单信息并合并 ---
  fetchOrderInfoAndMerge: function(productGroups, isSearch) {
    const agentInfo = wx.getStorageSync('agent_info');
    if (!agentInfo || !agentInfo.stockinfo_id) {
      this.distributeToColumns(productGroups);
      this.setData({ isLoading: false, isSearching: !!isSearch });
      return;
    }
    let kuanhaoList = [];
    productGroups.forEach(group => {
      if (group.products && Array.isArray(group.products)) {
        group.products.forEach(product => {
          if (product.style_id) {
            kuanhaoList.push(product.style_id);
          }
        });
      }
    });
    kuanhaoList = [...new Set(kuanhaoList)];
    if (kuanhaoList.length === 0) {
      this.distributeToColumns(productGroups);
      this.setData({ isLoading: false, isSearching: !!isSearch });
      return;
    }
    wx.request({
      url: 'https://bojun.uiijii.cn/api/get_order_status_by_kuanhao.php',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      data: {
        stockinfo_id: agentInfo.stockinfo_id,
        kuanhao_list: kuanhaoList
      },
      success: (res) => {
        if (res.statusCode === 200 && typeof res.data === 'object') {
          const orderedMap = res.data;
          productGroups.forEach(group => {
            if (group.products && Array.isArray(group.products)) {
              group.products.forEach(product => {
                product.ordered_info = orderedMap[product.style_id] || { status: false, colors: [] };
              });
            }
          });
          this.distributeToColumns(productGroups);
        } else {
          this.distributeToColumns(productGroups);
        }
      },
      fail: (err) => {
        this.distributeToColumns(productGroups);
      },
      complete: () => {
        this.setData({ isLoading: false, isSearching: !!isSearch });
      }
    });
  },

  // --- 瀑布流分列 ---
  distributeToColumns: function(dataList) {
    const leftColumn = [];
    const rightColumn = [];
    let leftHeight = 0;
    let rightHeight = 0;
    dataList.forEach((item) => {
      const estimatedHeight = this.calculateItemHeight(item);
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

  calculateItemHeight: function(item) {
    let baseHeight = 250;
    if (item.products && Array.isArray(item.products)) {
      baseHeight += item.products.length * 70;
      if (item.products[0] && item.products[0].ordered_info && item.products[0].ordered_info.status) {
        baseHeight += 40;
      }
    }
    return baseHeight;
  },

  // --- 搜索相关 ---
  onSearchInput: function(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm: function() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      this.onClearSearch();
      return;
    }
    this.setData({ isSearching: true }); // 标记处于搜索态
    const apiUrl = `https://xiaochengxu.uiijii.cn/api.php?action=search&brand_id=${this.data.brandId}&keyword=${keyword}`;
    this.fetchProductGroups(apiUrl, false); // 搜索态
  },

  onClearSearch: function() {
    this.setData({ searchKeyword: '', isSearching: false });
    this.distributeToColumns(this.data.originalGroupList);
  },

  // --- 详情页跳转 ---
  goToDetail: function (event) {
    const groupId = event.currentTarget.dataset.groupid;
    wx.navigateTo({ url: '/pages/detail/detail?group_id=' + groupId });
  },

  // --- 下拉刷新 ---
  onPullDownRefresh: function() {
    this.setData({ isSearching: false, searchKeyword: '' }); // 下拉刷新优先生效，清掉搜索态
    if (this.data.brandId) {
      this.fetchProductGroups(`https://xiaochengxu.uiijii.cn/api.php?action=getProductGroups&brand_id=${this.data.brandId}`, true);
    }
    wx.stopPullDownRefresh();
  }
});
