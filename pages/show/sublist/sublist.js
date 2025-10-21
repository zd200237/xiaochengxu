// pages/show/sublist.js (最终修正版)
Page({
  data: {
    seriesList: [], // 原始数据列表
    leftColumnList: [], // 左侧瀑布流列表
    rightColumnList: [], // 右侧瀑布流列表
    loading: true,
    seasonPath: '' 
  },

  onLoad: function (options) {
    const seasonPath = options.season || '';

    // ✅ 去掉前缀数字 + 各类横线（兼容 -, –, —, －, _）
    const cleanTitle = seasonPath.replace(/^\s*\d+[\s\-–—－_]+/, '').trim();

    // 保存原始路径和清理后的标题
    this.setData({ seasonPath });

    // ✅ 动态修改导航栏标题为去前缀后的名字
    wx.setNavigationBarTitle({ title: cleanTitle });

    // 加载子目录数据
    if (seasonPath) {
      this.getSeriesList(seasonPath);
    }
  },

  getSeriesList: function (seasonPath) {
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

  // --- 瀑布流分配逻辑 ---
  distributeToColumns: function (dataList) {
    const leftColumn = [];
    const rightColumn = [];
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

  goToDetail: function (event) {
    const seriesPath = event.currentTarget.dataset.path;
    wx.navigateTo({
      url: `/pages/show/detail?season=${this.data.seasonPath}&series=${seriesPath}`
    });
  }
});
