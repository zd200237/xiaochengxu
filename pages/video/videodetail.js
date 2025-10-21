// pages/video/videodetail/videodetail.js (恢复到最简全屏版)
Page({
  data: {
    videoInfo: null,
    isPlaying: false
  },

  onLoad: function (options) {
    if (options.item) {
      try {
        const videoInfo = JSON.parse(decodeURIComponent(options.item));
        this.setData({ videoInfo: videoInfo });
        if (videoInfo.title) {
          wx.setNavigationBarTitle({ title: videoInfo.title });
        }
      } catch (e) {
        console.error("解析视频数据失败", e);
        wx.showToast({ title: '加载失败', icon: 'error' });
      }
    }
  },

  // 点击播放，将 isPlaying 状态设为 true
  handlePlay: function() {
    this.setData({ isPlaying: true });
  },

  // 视频播放结束，恢复为详情页状态
  onVideoEnded: function() {
    this.setData({ isPlaying: false });
  },
  // 视频播放出错，恢复为详情页状态
  onVideoError: function() {
    wx.showToast({ title: '视频加载失败', icon: 'none' });
    this.setData({ isPlaying: false });
  },


  // --- 下载功能代码保持不变 ---

  onDownloadVideo(event) {
    const videoUrl = event.currentTarget.dataset.url;
    this.saveVideo(videoUrl);
  },

  saveVideo(videoUrl) {
    if (!videoUrl) {
      wx.showToast({ title: '视频地址无效', icon: 'none' });
      return;
    }
    wx.getSetting({
      success: res => {
        // 情况一：用户从未授权过，或者已经授权了
        if (res.authSetting['scope.writePhotosAlbum'] !== false) {
          this.downloadAndSave(videoUrl);
        } else {
          // 情况二：用户明确点击过“拒绝”
          wx.showModal({
            title: '授权提示',
            content: '您需要授权保存到相册，才能下载视频。是否前往设置页面开启授权？',
            success: modalRes => {
              if (modalRes.confirm) {
                // 用户同意去设置页，则打开设置
                wx.openSetting({
                  success: settingRes => {
                    // 如果用户在设置页里打开了授权，就尝试再次下载
                    if (settingRes.authSetting['scope.writePhotosAlbum']) {
                      this.downloadAndSave(videoUrl);
                    }
                  }
                });
              }
            }
          });
        }
      }
    });
},

  downloadAndSave(videoUrl) {
    wx.showLoading({ title: '下载中...' });
    wx.downloadFile({
      url: videoUrl,
      success: res => {
        if (res.statusCode === 200) {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => { wx.showToast({ title: '保存成功' }); },
            fail: e => { wx.showToast({ title: '保存失败', icon: 'none' }); }
          });
        } else {
          wx.showToast({ title: '下载失败', icon: 'none' });
        }
      },
      fail: e => {
        wx.showToast({ title: '下载失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});