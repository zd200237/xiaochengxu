// 文件路径: /pages/search/search.js
Page({
  data: {
    loading: true,
    keyword: '',
    groupList: [], // 原始数据列表
    leftColumnList: [], // 左侧瀑布流列表
    rightColumnList: [] // 右侧瀑布流列表
  },

  onLoad: function(options) {
    const keyword = decodeURIComponent(options.keyword || '');
    this.setData({ keyword: keyword });

    if (keyword) {
      this.doSearch(keyword);
    } else {
      // 如果没有关键字，直接显示无结果状态
      this.setData({ loading: false });
    }
  },

  doSearch: function(keyword) {
    this.setData({ loading: true, groupList: [], leftColumnList: [], rightColumnList: [] });
    
    wx.request({
      url: 'https://xiaochengxu.uiijii.cn/api.php?action=globalSearch&keyword=' + encodeURIComponent(keyword),
      success: (res) => {
        // 关键：确保只在请求成功且返回的是数组时才处理数据
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({ groupList: res.data });
          this.distributeToColumns(res.data); // 调用瀑布流分配函数
        } else {
          // 如果返回的不是数组（比如是一个错误对象），则清空列表
          this.setData({ groupList: [], leftColumnList: [], rightColumnList: [] });
          wx.showToast({ title: '返回数据异常', icon: 'none' });
        }
      },
      fail: (err) => {
        // 网络请求失败时的处理
        this.setData({ groupList: [], leftColumnList: [], rightColumnList: [] });
        wx.showToast({ title: '网络请求失败', icon: 'error' });
      },
      complete: () => {
        // 无论成功失败，最后都结束加载状态
        this.setData({ loading: false });
      }
    });
  },

  // 瀑布流分配逻辑
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

  // 点击卡片跳转到详情页
  goToDetail: function (event) {
    const groupId = event.currentTarget.dataset.groupid;
    wx.navigateTo({ url: '/pages/detail/detail?group_id=' + groupId });
  }
});