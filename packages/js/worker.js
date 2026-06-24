self.onmessage = function(event) {
    console.log(event)
    let sum = 0;
    for (let i = 0; i < event.data; i++) {
        sum += i;
    }
    self.postMessage(sum); // 将结果发送回主线程
};