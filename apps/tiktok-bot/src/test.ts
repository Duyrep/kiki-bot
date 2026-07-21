// import Search from "./commands/search";

import Search from "./commands/search";

// const readline = require("readline");

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// const searchInstance = new Search();

// function startLoop() {
//   rl.question("\nNhập arguments (cách nhau bằng dấu phẩy hoặc khoảng trắng): ", async (input: string) => {
//     // Thoát nếu người dùng gõ 'exit' hoặc 'quit'
//     if (input.trim().toLowerCase() === "exit" || input.trim().toLowerCase() === "quit") {
//       console.log("Đang thoát...");
//       rl.close();
//       return;
//     }

//     let args: string[] = [];
//     if (input.includes(",")) {
//       args = input.split(",").map(arg => arg.trim());
//     } else {
//       args = input.trim().split(/\s+/);
//     }

//     if (args.length === 0 || args[0] === "") {
//       console.log("Vui lòng nhập arguments hợp lệ.");
//       startLoop();
//       return;
//     }

//     try {
//       console.log(`\n--- Đang chạy: run(${args.map(a => `"${a}"`).join(", ")}) ---`);

//       await searchInstance.run(...args);

//     } catch (error) {
//       console.error("Đã xảy ra lỗi khi chạy lệnh:", error);
//     }

//     // Tiếp tục vòng lặp
//     startLoop();
//   });
// }

// // Bắt đầu chạy vòng lặp liên tục
// console.log("Gõ 'exit' hoặc 'quit' để dừng chương trình.");
// startLoop();

new Search().run("duyrep", "yeu lam chi");
new Search().run("kiki", "come my way");
