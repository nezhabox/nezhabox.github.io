<script>
  ;(function () {
    let trafficTimer = null;       // 定时刷新定时器（30秒）
    let debounceTimer = null;      // 防抖定时器（200ms）

    const config = {
      showTrafficStats: true,
      insertPosition: 'before', // 可选值：'after', 'before', 'replace'
      interval: 30000, // 定时更新间隔
      debounceDelay: 200           // 200ms防抖延迟
    };

    function formatFileSize(bytes) {
      if (bytes === 0) return { value: '0', unit: 'B' };
      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      let unitIndex = 0;
      let size = bytes;
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      return {
        value: size.toFixed(unitIndex === 0 ? 0 : 2),
        unit: units[unitIndex]
      };
    }

    function calculatePercentage(used, total) {
      used = Number(used);
      total = Number(total);
      if (used > 1e15 || total > 1e15) {
        used /= 1e10;
        total /= 1e10;
      }
      return (used / total * 100).toFixed(1);
    }

    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }

    function updateTrafficStats() {
      fetch('/api/v1/service')
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            console.log('API 请求成功但返回数据不正确');
            return;
          }

          const trafficData = data.data.cycle_transfer_stats;
          const serverMap = new Map();

          for (const cycleId in trafficData) {
            const cycle = trafficData[cycleId];
            if (!cycle.server_name || !cycle.transfer) continue;

            for (const serverId in cycle.server_name) {
              const serverName = cycle.server_name[serverId];
              const transfer = cycle.transfer[serverId];
              const max = cycle.max;
              const from = cycle.from;
              const to = cycle.to;

              if (serverName && transfer !== undefined && max && from && to) {
                serverMap.set(serverName, {
                  id: serverId,
                  transfer: transfer,
                  max: max,
                  name: cycle.name,
                  from: from,
                  to: to
                });
              }
            }
          }

          serverMap.forEach((serverData, serverName) => {
            const targetElement = Array.from(document.querySelectorAll('section.grid.items-center.gap-2'))
              .find(el => el.textContent.trim().includes(serverName));

            if (!targetElement) {
              console.log(`未找到服务器 ${serverName}(ID: ${serverData.id}) 的元素`);
              return;
            }

            const usedFormatted = formatFileSize(serverData.transfer);
            const totalFormatted = formatFileSize(serverData.max);
            const percentage = calculatePercentage(serverData.transfer, serverData.max);
            const fromFormatted = formatDate(serverData.from);
            const toFormatted = formatDate(serverData.to);
            const uniqueClassName = 'traffic-stats-for-server-' + serverData.id;

            const containerDiv = targetElement.closest('div');
            const oldSection = containerDiv.querySelector('section.flex.items-center.w-full.justify-between.gap-1');
            const existing = containerDiv.querySelector('.' + uniqueClassName);

            if (config.showTrafficStats) {
              if (existing) {
                existing.querySelector('.used-traffic').textContent = usedFormatted.value;
                existing.querySelector('.used-unit').textContent = usedFormatted.unit;
                existing.querySelector('.total-traffic').textContent = totalFormatted.value;
                existing.querySelector('.total-unit').textContent = totalFormatted.unit;
                existing.querySelector('.from-date').textContent = fromFormatted;
                existing.querySelector('.to-date').textContent = toFormatted;
                existing.querySelector('.progress-bar').style.width = percentage + '%';
              } else if (oldSection) {
                const newElement = document.createElement('div');
                newElement.classList.add('space-y-1.5', 'new-inserted-element', uniqueClassName);
                newElement.style.width = '100%';
                newElement.innerHTML = `
                  <div class="flex items-center justify-between">
                    <div class="flex items-baseline gap-1">
                      <span class="text-[10px] font-medium text-neutral-800 dark:text-neutral-200 used-traffic">${usedFormatted.value}</span>
                      <span class="text-[10px] font-medium text-neutral-800 dark:text-neutral-200 used-unit">${usedFormatted.unit}</span>
                      <span class="text-[10px] text-neutral-500 dark:text-neutral-400">/ </span>
                      <span class="text-[10px] text-neutral-500 dark:text-neutral-400 total-traffic">${totalFormatted.value}</span>
                      <span class="text-[10px] text-neutral-500 dark:text-neutral-400 total-unit">${totalFormatted.unit}</span>
                    </div>
                    <div class="text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
                      <span class="from-date">${fromFormatted}</span>
                      <span class="text-neutral-500 dark:text-neutral-400">-</span>
                      <span class="to-date">${toFormatted}</span>
                    </div>
                  </div>
                  <div class="relative h-1.5">
                    <div class="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-full"></div>
                    <div class="absolute inset-0 bg-emerald-500 rounded-full transition-all duration-300 progress-bar" style="width: ${percentage}%;"></div>
                  </div>
                `;
                if (config.insertPosition === 'before') oldSection.before(newElement);
                else if (config.insertPosition === 'replace') oldSection.replaceWith(newElement);
                else oldSection.after(newElement);
              }
            } else {
              if (existing) existing.remove();
            }
          });
        })
        .catch(err => console.error('流量数据获取失败:', err));
    }

    function startPeriodicRefresh() {
      if (trafficTimer) clearInterval(trafficTimer);
      trafficTimer = setInterval(() => {
        updateTrafficStats();
      }, config.interval);
    }

    function onDomChildListChange() {
      // 发生 childList 变化，清除周期刷新定时器
      if (trafficTimer) {
        clearInterval(trafficTimer);
        trafficTimer = null;
      }
      // 防抖：200ms后执行刷新，如果期间没有新的childList变化则触发
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        updateTrafficStats();
        // 防抖触发后重新开启30秒周期刷新
        startPeriodicRefresh();
      }, config.debounceDelay);
    }

    // 监听器
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const nodes = [...mutation.addedNodes, ...mutation.removedNodes];

          const matched = nodes.some(node => {
            if (node.nodeType !== 1) return false;

            const classList = node.classList || [];
            // 检查是否为 span 且具有目标类名
            return (
              node.tagName === 'SPAN' &&
              classList.contains('text-muted-foreground') &&
              Array.from(classList).some(cls => cls.includes('text-['))
            );
          });

          if (matched) {
            onDomChildListChange();
            break;
          }
          // 如果添加或删除的节点中有子孙包含目标 span
          const deepMatched = nodes.some(node => {
            if (node.nodeType !== 1 || !node.querySelectorAll) return false;
            return Array.from(node.querySelectorAll('span.text-muted-foreground'))
              .some(el => Array.from(el.classList).some(cls => cls.includes('text-[')));
          });

          if (deepMatched) {
            onDomChildListChange();
            break;
          }
        }
      }
    });

    // 监听目标节点，建议替换成你关注的容器
    const targetNode = document.querySelector('main') || document.body;

    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });

    // 初始启动周期刷新
    startPeriodicRefresh();

    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
      if (trafficTimer) clearInterval(trafficTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
    });
  })();
</script>
