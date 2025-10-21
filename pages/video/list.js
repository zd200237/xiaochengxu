// pages/video/list.js (卡片样式版)
Page({
  data: { seasons: [] },
  onLoad: function () { this.getSeasons(); },
  getSeasons: function() {
    wx.request({
      url: 'https://xiaochengxu.uiijii.cn/get_video_seasons.php',
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({ seasons: res.data });
        }
      }
    });
  },
  goToDetail: function(event) {
    const item = event.currentTarget.dataset.item;
    // 如果该季节下没有视频，则提示用户
    if (!item.hasContent) {
      wx.showToast({ title: '暂无视频', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/video/detail?season=${encodeURIComponent(item.name)}` });
  }
});