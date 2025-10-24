Page({
  data: {
    posts: []
  },

  onLoad() {
    this.fetchFeed();
  },

  onPullDownRefresh() {
    this.fetchFeed(() => wx.stopPullDownRefresh());
  },

  // 拉取数据（走后端接口）
  fetchFeed(done) {
    const url = 'https://xiaochengxu.uiijii.cn/api/social_feed_list.php?page=1&page_size=10';
    wx.request({
      url,
      header: { 'content-type': 'application/json' },
      success: (res) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        this.setData({ posts: this.normalize(list) });
        if (!list.length) wx.showToast({ title: '暂无数据', icon: 'none' });
      },
      fail: (err) => {
        console.error('请求失败:', err);
        wx.showToast({ title: '接口请求失败', icon: 'none' });
      },
      complete: () => { done && done(); }
    });
  },

  // 规范化：过滤出要渲染的媒体、确定列数
  normalize(list) {
    const defaultAvatar = '/assets/icons/pengyouquan.png';
    return (list || []).map((it) => {
      const isVideo = it.type === 'video';
      const images = (it.media || []).filter(m => m.kind === 'image');
      const cover  = (it.media || []).find(m => m.kind === 'cover');
      const video  = (it.media || []).find(m => m.kind === 'video');

      // 只渲染图片和封面；视频帖只取 1 张封面
      const displayMedia = isVideo ? (cover ? [cover] : []) : images;

      let gridClass = 'cols-3';
      const count = displayMedia.length;
      if (count === 1) gridClass = 'cols-1';
      else if (count === 2 || count === 4) gridClass = 'cols-2';

      const needToggle = (it.text || '').length > 120;

      return {
        ...it,
        author: {
          name: (it.author && it.author.name) ? it.author.name : 'UIIJII&ENNO',
          avatar: (it.author && it.author.avatar) ? it.author.avatar : defaultAvatar
        },
        isVideo,
        videoUrl: video ? video.url : '',
        displayMedia,
        gridClass,
        needToggle,
        expanded: false
      };
    });
  },

  // 切换“全文/收起”
  toggleExpand(e) {
    const idx = e.currentTarget.dataset.index;
    const key = `posts[${idx}].expanded`;
    this.setData({ [key]: !this.data.posts[idx].expanded });
  },

  // 点击媒体：视频→预览视频；图片→预览图片
  handleMediaTap(e) {
    const pindex = e.currentTarget.dataset.pindex;
    const midx   = e.currentTarget.dataset.index;
    const kind   = e.currentTarget.dataset.kind;
    const video  = e.currentTarget.dataset.video;
    const post   = this.data.posts[pindex];

    if (kind === 'cover' && post.isVideo && video) {
      if (wx.previewMedia) {
        wx.previewMedia({ sources: [{ url: video, type: 'video' }], current: 0 });
      } else {
        wx.showToast({ title: '正在打开视频', icon: 'none' });
      }
      return;
    }

    const urls = (post.displayMedia || []).map(m => m.url);
    if (!urls.length) { wx.showToast({ title: '无可预览图片', icon: 'none' }); return; }
    wx.previewImage({ current: urls[midx] || urls[0], urls });
  },

  // 一键导出：
  // - 图片帖：保存全部图片 + 复制文案
  // - 视频帖：下载视频并保存到相册 + 复制文案
  async handleSaveAll(e) {
    const idx = e.currentTarget.dataset.index;
    const post = this.data.posts[idx] || {};
    const text = post.text || '';

    try {
      if (post.isVideo && post.videoUrl) {
        await this.ensureAlbumPermission();
        await this.saveVideoToAlbum(post.videoUrl);
        if (text) await this.copyText(text);
        wx.showModal({
          title: '已准备就绪',
          content: '视频已保存到相册，文案已复制。现在打开朋友圈即可发布。',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }

      // 图片帖
      const images = (post.displayMedia || [])
        .filter(m => m && m.url)
        .map(m => m.url);

      if (!images.length && !text) {
        wx.showToast({ title: '没有可导出的内容', icon: 'none' });
        return;
      }

      if (images.length) {
        await this.ensureAlbumPermission();
        await this.saveAllImagesSequential(images);
      }
      if (text) await this.copyText(text);

      wx.showModal({
        title: '已准备就绪',
        content: (images.length ? '全部图片已保存到相册，' : '') + (text ? '文案已复制。' : '') + '现在打开朋友圈即可发布。',
        showCancel: false,
        confirmText: '知道了'
      });
    } catch (err) {
      console.error('Export error:', err);
      wx.showToast({ title: '导出失败，请稍后重试', icon: 'none' });
    }
  },

  // 权限：写入相册
  ensureAlbumPermission() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          const granted = res.authSetting['scope.writePhotosAlbum'];
          if (granted) { resolve(); return; }
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: resolve,
            fail: () => {
              wx.showModal({
                title: '需要相册权限',
                content: '保存到相册需要授权，请前往设置开启权限。',
                confirmText: '去设置',
                success: (r) => {
                  if (r.confirm) {
                    wx.openSetting({
                      success: (rst) => {
                        if (rst.authSetting['scope.writePhotosAlbum']) resolve();
                        else reject(new Error('no-permission'));
                      }
                    });
                  } else {
                    reject(new Error('deny'));
                  }
                }
              });
            }
          });
        },
        fail: reject
      });
    });
  },

  // 保存视频到相册
  saveVideoToAlbum(url) {
    return new Promise((resolve, reject) => {
      wx.showLoading({ title: '保存视频中' });
      wx.downloadFile({
        url,
        success: (res) => {
          const filePath = res.tempFilePath || res.filePath;
          wx.saveVideoToPhotosAlbum({
            filePath,
            success: () => { wx.hideLoading(); resolve(); },
            fail: (err) => { wx.hideLoading(); console.error('saveVideo fail', err); reject(err); }
          });
        },
        fail: (err) => { wx.hideLoading(); console.error('download fail', err); reject(err); }
      });
    });
  },

  // 逐张保存图片
  saveAllImagesSequential(urls) {
    return new Promise((resolve) => {
      if (!urls.length) { resolve(); return; }
      wx.showLoading({ title: `保存中 0/${urls.length}` });

      let i = 0;
      const saveNext = () => {
        if (i >= urls.length) { wx.hideLoading(); resolve(); return; }
        wx.getImageInfo({
          src: urls[i],
          success: (res) => {
            wx.saveImageToPhotosAlbum({
              filePath: res.path,
              success: () => { i++; wx.showLoading({ title: `保存中 ${i}/${urls.length}` }); saveNext(); },
              fail: () => { i++; wx.showLoading({ title: `保存中 ${i}/${urls.length}` }); saveNext(); }
            });
          },
          fail: () => { i++; wx.showLoading({ title: `保存中 ${i}/${urls.length}` }); saveNext(); }
        });
      };
      saveNext();
    });
  },

  // 复制文案
  copyText(text) {
    return new Promise((resolve, reject) => {
      if (!text) { resolve(); return; }
      wx.setClipboardData({
        data: text,
        success: () => { wx.showToast({ title: '文案已复制', icon: 'success' }); resolve(); },
        fail: reject
      });
    });
  }
});