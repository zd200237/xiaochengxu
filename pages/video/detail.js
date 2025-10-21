// pages/video/detail.js (V4 - 优化返回定位)
const app = getApp();
let searchTimer = null;

Page({
  data: { 
    videoList: [],       
    originalVideoList: [],
    leftColumnList: [], 
    rightColumnList: [], 
    loading: true,
    seasonName: '',
    
    // !!! 核心修改 1: 新增两个状态，用于页面定位 !!!
    isLoaded: false,   // 数据是否已加载过的标记
    scrollTop: 0       // 保存页面的滚动位置
  },

  onLoad: function (options) {
    const seasonName = decodeURIComponent(options.season || '');
    if (seasonName) {
      this.setData({ seasonName: seasonName });
      wx.setNavigationBarTitle({ title: seasonName });
    }
  },

  // !!! 核心修改 2: 重写 onShow 逻辑 !!!
  onShow: function() {
    // 如果 isLoaded 为 true，说明是“返回”到这个页面
    // 此时不需要重新加载数据，而是恢复滚动位置
    if (this.data.isLoaded) {
      wx.pageScrollTo({
        scrollTop: this.data.scrollTop,
        duration: 0 // 立即恢复，不需要滚动动画
      });
    } else {
      // 如果 isLoaded 为 false，说明是第一次进入页面，执行加载
      this.loadVideos();
    }
  },

  loadVideos: function() {
    this.setData({ loading: true, videoList: [], leftColumnList: [], rightColumnList: [] });
    const videoSource = app.globalData.videoSource;
    let apiUrl = '';

    if (videoSource === 'wechat') {
      apiUrl = 'https://xiaochengxu.uiijii.cn/get_wechat_videos.php';
    } else {
      apiUrl = `https://xiaochengxu.uiijii.cn/get_season_videos.php?season=${encodeURIComponent(this.data.seasonName)}`;
    }
    
    wx.request({
      url: apiUrl,
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const formattedList = res.data.map(item => ({
            id: item.feedId || item.self_hosted_url, 
            cover: item.cover_url || item.thumbnail_url,
            title: item.title || item.description || '暂无标题',
            feedId: item.feedId,
            self_hosted_data: item
          }));

          this.setData({
            videoList: formattedList,
            originalVideoList: formattedList
          });
          this.distributeToColumns(formattedList);
        }
      },
      complete: () => { 
        this.setData({ 
          loading: false,
          // !!! 核心修改 3: 数据加载完成后，将 isLoaded 标记为 true !!!
          isLoaded: true 
        }); 
      }
    });
  },
  
  // !!! 核心修改 4: 新增 onPageScroll 函数来监听滚动 !!!
  onPageScroll: function(e) {
    // 节流，防止频繁 setData (可选优化，但推荐)
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      this.setData({
        scrollTop: e.scrollTop
      });
    }, 100); // 100毫秒记录一次
  },

  distributeToColumns: function(dataList) {
    const left = [], right = [];
    dataList.forEach((item, index) => { (index % 2 === 0 ? left : right).push(item); });
    this.setData({ leftColumnList: left, rightColumnList: right });
  },

  playVideo: function(event) {
    const item = event.currentTarget.dataset.item;
    const videoSource = app.globalData.videoSource;

    if (videoSource === 'wechat') {
      wx.openChannelsActivity({
        finderUserName: "sphd3MzWP8YGynB",
        feedId: item.feedId
      });
    } else {
      const clickedIndex = this.data.videoList.findIndex(v => v.id === item.id);
      const listStr = encodeURIComponent(JSON.stringify(this.data.videoList));
      const itemStr = encodeURIComponent(JSON.stringify(item));
      wx.navigateTo({
        url: `/pages/video/videodetail?item=${itemStr}&list=${listStr}&index=${clickedIndex}`
      });
    }
  },

  onSearchInput: function(e) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const keyword = e.detail.value.trim().toLowerCase();
      const originalList = this.data.originalVideoList;

      if (!keyword) {
        this.setData({ videoList: originalList });
        this.distributeToColumns(originalList);
        return;
      }

      const filteredList = originalList.filter(video => {
        return video.title && video.title.toLowerCase().includes(keyword);
      });

      this.setData({ videoList: filteredList });
      this.distributeToColumns(filteredList);
    }, 300);
  }
});