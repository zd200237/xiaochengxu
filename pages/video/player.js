Page({
  data: {
    videoList: [],
    currentIndex: 0,
    renderList: [],
    baseIndex: 0
  },

  onLoad(options) {
    if (options.list && options.index) {
      try {
        const videoList = JSON.parse(decodeURIComponent(options.list));
        const currentIndex = parseInt(options.index, 10);
        this.setData({
          videoList,
          currentIndex
        }, () => {
          this.updateRenderList(currentIndex);
        });
      } catch (e) {
        console.error("解析视频列表失败", e);
        wx.showToast({ title: '加载失败', icon: 'error' });
      }
    }
  },

  updateRenderList(current) {
    const { videoList } = this.data;
    let renderList = [];
    let baseIndex = current - 1;
    if (baseIndex < 0) baseIndex = 0;
    if (baseIndex > videoList.length - 3) baseIndex = Math.max(videoList.length - 3, 0);
    for (let i = 0; i < 3; i++) {
      if (baseIndex + i < videoList.length) {
        renderList.push(videoList[baseIndex + i]);
      }
    }
    this.setData({
      renderList,
      baseIndex
    });
  },

  onSwiperChange(event) {
    const swiperIndex = event.detail.current;
    const { baseIndex, currentIndex } = this.data;
    const newCurrentIndex = baseIndex + swiperIndex;
    if (currentIndex !== newCurrentIndex) {
      this.stopAllVideos(swiperIndex); // 先停止其他视频
      this.setData({
        currentIndex: newCurrentIndex
      });
      // 延迟更新，确保视频先被停止
      setTimeout(() => {
        this.updateRenderList(newCurrentIndex);
      }, 100);
    }
  },

  stopAllVideos(currentSwiperIdx) {
    for (let i = 0; i < 3; i++) {
      if (i !== currentSwiperIdx) {
        try {
          // 第二个参数 this 必不可少！
          const ctx = wx.createVideoContext(`video-${i}`, this);
          if (ctx) {
            ctx.pause();
            ctx.seek(0);
          }
        } catch (e) {
          console.error('停止视频失败:', e);
        }
      }
    }
  },

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
        if (res.authSetting['scope.writePhotosAlbum'] === false) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => { this.downloadAndSave(videoUrl); },
            fail: () => { wx.showToast({ title: '需要授权保存相册', icon: 'none' }); }
          });
        } else {
          this.downloadAndSave(videoUrl);
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
