Page({
  data: {
    list: [],
    loading: true,
    storeName: ''
  },

  onLoad() {
    this.loadData();
  },

  loadData() {
    const token = wx.getStorageSync('token');
    const agentInfo = wx.getStorageSync('agent_info');

    if (!token || !agentInfo || !agentInfo.stockinfo_id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.redirectTo({ url: '/pages/login/index' });
      return;
    }

    this.setData({ storeName: agentInfo.stockinfo_name || '我的门店' });

    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: 'https://bojun.uiijii.cn/api/get_season_rate.php',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      },
      data: {
        stockinfo_id: agentInfo.stockinfo_id
      },
      success: (res) => {
        if (res.data.code === 0) {
          let list = res.data.data.map(item => {
            const rate = parseFloat(item.firretrate || 0);
            return {
              sale_season: item.sale_season || '',
              firretrate_text: (rate * 100).toFixed(2) + '%'
            };
          });

          // ✅ 定义季节顺序
          const seasonOrder = ['春', '夏', '秋', '羽绒', '冬'];

          // ✅ 解析出年份和季节，排序逻辑
          list = list
            .map(item => {
              const match = item.sale_season.match(/^(\d+)(春|夏|秋|羽绒|冬)/);
              if (!match) return null;
              return {
                ...item,
                year: parseInt(match[1]),
                season: match[2]
              };
            })
            .filter(Boolean);

          // ✅ 过滤掉 25秋 以前的
          list = list.filter(item => {
            if (item.year > 25) return true;
            if (item.year === 25) {
              return ['秋', '羽绒', '冬'].includes(item.season);
            }
            return false;
          });

          // ✅ 按年份倒序 + 季节顺序（春→夏→秋→羽绒→冬）
          list.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year; // 年份倒序
            return seasonOrder.indexOf(b.season) - seasonOrder.indexOf(a.season); // 同年季节倒序
          });

          this.setData({ list, loading: false });
        } else {
          wx.showToast({ title: res.data.msg || '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});