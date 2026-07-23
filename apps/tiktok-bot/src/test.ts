import Search from "./commands/search";

async function testSearchCommand() {
	const search = new Search();
	const userId = "test_user_429";

	console.log("=== TEST 1: Kiểm tra Rate Limit (Gửi 3 request liên tiếp) ===");

	for (let i = 1; i <= 3; i++) {
		console.log(`\n--- Lần gọi ${i} ---`);
		try {
			await search.run(userId, "Em Của Ngày Hôm Qua");
		} catch (error: any) {
			if (error?.status === 429 || error?.statusCode === 429) {
				console.log(`[PASS] Đã dính Rate Limit 429 ở lần gọi thứ ${i}!`);
			} else {
				console.error(`[ERROR] Lỗi không xác định ở lần gọi ${i}:`, error);
			}
		}
	}

	console.log("\n==================================================");
	console.log("=== TEST 2: Kiểm tra danh sách 10 bài hát ===");
	console.log("==================================================\n");

	const testCases = [
		{ user: "User_A", song: "Chúng Ta Của Tương Lai" },
		{ user: "User_B", song: "Nơi Này Có Anh" },
		{ user: "User_C", song: "Waiting For You" },
		{ user: "User_D", song: "Cắt Đôi Nỗi Sầu" },
		{ user: "User_E", song: "Nếu Lúc Đó" },
		{ user: "User_F", song: "Thắc Mắc" },
		{ user: "User_G", song: "Chị Ngả Em Nâng" },
		{ user: "User_H", song: "Có Chắc Yêu Là Đây" },
		{ user: "User_I", song: "Từng Là" },
		{ user: "User_K", song: "Ngày Mai Người Ta Lấy Chồng" },
	];

	for (const [index, item] of testCases.entries()) {
		console.log(`[${index + 1}/10] Testing: ${item.user} -> "${item.song}"`);
		try {
			await search.run(item.user, item.song);
		} catch (error) {
			console.error(`[FAIL] Lỗi khi tìm bài "${item.song}":`, error);
		}
	}
}

// Chạy test
// testSearchCommand();

new Search().run("kiki", "bac phan");
new Search().run("duyrep", "come my way");
