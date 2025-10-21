// pages/show/sublist.js (更新后)
Page({
  data: {
    seriesList: [], // 原始数据列表
    leftColumnList: [], // 左侧瀑布流列表
    rightColumnList: [], // 右侧瀑布流列表
    loading: true,
    seasonPath: '' 
  },
  onLoad: function (options) {
    const seasonPath = options.season;
    if (seasonPath) {
      this.setData({ seasonPath: seasonPath });
      this.getSeriesList(seasonPath);
      wx.setNavigationBarTitle({ title: seasonPath });
    }
  },
  getSeriesList: function(seasonPath) {
    this.setData({ loading: true });
    wx.request({
      url: `https://xiaochengxu.uiijii.cn/get_show_subfolders.php?season=${seasonPath}`,
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({ seriesList: res.data });
          // --- 核心改动：请求成功后，调用瀑布流分配函数 ---
          this.distributeToColumns(res.data);
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'error' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // --- 新增：瀑布流分配逻辑 ---
  distributeToColumns: function(dataList) {
    const leftColumn = [];
    const rightColumn = [];
    // 简单的交错分配
    dataList.forEach((item, index) => {
      if (index % 2 === 0) {
        leftColumn.push(item);
      } else {
        rightColumn.push(item);
      }
    });
    this.setData({
      leftColumnList: leftColumn,
      rightColumnList: rightColumn,
    });
  },

  goToDetail: function(event) {
    const seriesPath = event.currentTarget.dataset.path;
    wx.navigateTo({
      url: `/pages/show/detail?season=${this.data.seasonPath}&series=${seriesPath}`
    });
  }
});