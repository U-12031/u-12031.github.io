/** クエリに合わせた要素(複数可)を返す
 * @param {string} query クエリ
 * @param {boolean} isAll 複数返すか
 */
function query(query, isAll=false) {
	return isAll ? document.querySelectorAll(query) : document.querySelector(query);
}
/** その要素が入っているメモの番号を返す
 * @param {HTMLElement} element 番号を知りたい要素
 */
function elementBelongMemoNum(element) {
	return element.closest(".memo").id.match(/\d+/)[0];
}

/** クッキーに保存する
 * @param {string} key キー
 * @param {string} value 値
 * @returns {{key: string, value: string}}
 */
function cookieSave(key, value) {
	document.cookie = `${key}=${value}; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
	return {
		key: key,
		value: value
	};
}
/** クッキーを削除する
 * @param {string} key キー
 */
function cookieDelete(key) {
	document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
/** クッキーを読み込む
 * @param {string} key キー
 * @returns {string|null} 値(ない場合はnull)
*/
function cookieLoad(key) {
	let cookies = document.cookie.split('; ');
	for (let i = 0; i < cookies.length; i++) {
		let cookie = cookies[i].split('=');
		if (cookie[0] == key) return cookie[1];
	}
	return null; // ここまで処理が続いている = returnが実行されず値が返されていない(値が存在しない)
}

/** メモを追加する
 * @returns {number} 追加したメモの番号
 */
function addMemo() {
	memoCount++;
	const memoContent = MEMO_CONTENT.replaceAll("{n}", memoCount);
	memosParent.insertAdjacentHTML("beforeend", memoContent);
	return memoCount;
}

let memoCount = 1;
const MEMO_CONTENT = `
<details open class="memo" id="memo{n}">
	<summary class="memoTitle">メモ{n}</summary>
	<label>タイトル:<textarea class="memoTitleInput" rows="1" placeholder="メモ{n}"></textarea></label>
	|
	<label><input type="checkbox" class="isSave" checked>保存する</label></label>
	|
	<button class="copyBt">全部コピー</button>
	|
	<span><span class="charCount">0</span>文字</span>
	|
	<span>検索・置換
		<input class="replaceFrom" placeholder="検索・置換">
		<button class="searchBt">検索する</button>
		→
		<input class="replaceTo" placeholder="(置換用)置換後">
		<button class="replaceBt" disabled>置換する</button>
		<span class="replaceResult"></span>
	</span>
	|
	<span class="deleteMemoParent">
		<button class="deleteMemoBt">メモを削除</button>
		<dialog class="deleteMemoModal" closedBy="any">
			<p>メモを削除しますか?</p>
			<button class="deleteMemoCancelBt">キャンセル</button>
			<button class="deleteMemoYesBt">削除する</button>
		</dialog>
	</span>
	<textarea class="body" name="memoBody{n}"></textarea>
	URLたち
	<ul class="URLs">
	</ul>
</details>
`; // {n}は全て処理する時に置換する
const ELEMENT_EVENTS = {
	memoTitleInput: (el, memoNum) => {
		const isSave = query(`#memo${memoNum} .isSave`).checked;
		query(`#memo${memoNum} .memoTitle`).innerHTML = el.value == "" ? `メモ${memoNum}` : el.value;
		if(isSave) {
			cookieSave(`memo${memoNum}Title`, el.value);
		}
	},
	isSave: (el, memoNum) => {
		const thisMemoContent = query(`#memo${memoNum} .body`).value;
		if(el.checked) {
			cookieSave(`memo${memoNum}`, thisMemoContent);
			cookieSave(`memo${memoNum}Title`, query(`#memo${memoNum} .memoTitleInput`).value);
		} else {
			cookieDelete(`memo${memoNum}`);
			cookieDelete(`memo${memoNum}Title`);
		}
	},
	copyBt: (el, memoNum) => {
		try {
			navigator.clipboard.writeText(query(`#memo${memoNum} .body`).value);
			alert("クリップボードにコピーしました！")
		} catch (error) {
			console.error(error);
			alert("クリップボードへのコピーに失敗しました…\n処理中に画面を離れたか、ブラウザが古すぎる可能性があります")
		}
	},
	replaceFrom: (el, memoNum) => {
		const replaceTo = query(`#memo${memoNum} .replaceTo`).value;
		query(`#memo${memoNum} .searchBt`).disabled = el.value == "";
		query(`#memo${memoNum} .replaceBt`).disabled = (el.value == "") || (replaceTo.value == "");
	},
	searchBt: (el, memoNum) => {
		const searchText = query(`#memo${memoNum} .replaceFrom`).value;
		const hitTimes = query(`#memo${memoNum} .body`).value.split(searchText).length - 1;
		query(`#memo${memoNum} .replaceResult`).innerHTML = `「${searchText}」は${hitTimes}個ありました`;
	},
	replaceTo: (el, memoNum) => {
		const replaceFrom = query(`#memo${memoNum} .replaceFrom`).value;
		query(`#memo${memoNum} .replaceBt`).disabled = (el.value == "") || (replaceFrom == "");
	},
	replaceBt: (el, memoNum) => {
		const replaceFrom = query(`#memo${memoNum} .replaceFrom`).value.replaceAll("[改行]", "\n").replaceAll("[タブ]", "\t");
		const replaceTo = query(`#memo${memoNum} .replaceTo`).value.replaceAll("[改行]", "\n").replaceAll("[タブ]", "\t").replaceAll("[削除]", "");
		const hitTimes = query(`#memo${memoNum} .body`).value.split(replaceFrom).length - 1;
		query(`#memo${memoNum} .body`).value = query(`#memo${memoNum} .body`).value.replaceAll(replaceFrom, replaceTo);
		query(`#memo${memoNum} .charCount`).innerHTML = query(`#memo${memoNum} .body`).value.length;
		if(replaceTo === "") {
			query(`#memo${memoNum} .replaceResult`).innerHTML = `${hitTimes}個の「${replaceFrom}」を削除しました`;
		} else {
			query(`#memo${memoNum} .replaceResult`).innerHTML = `${hitTimes}個の「${replaceFrom}」を「${replaceTo}」に置換しました`;
		}
	},
	deleteMemoBt: (el, memoNum) => {
		query(`#memo${memoNum} .deleteMemoModal`).style.display = "block";
	},
	deleteMemoCancelBt: (el, memoNum) => {
		query(`#memo${memoNum} .deleteMemoModal`).style.display = "none";
	},
	deleteMemoYesBt: (el, memoNum) => {
		query(`#memo${memoNum}`).remove();
		cookieDelete(`memo${memoNum}`);
		cookieDelete(`memo${memoNum}Title`);
		memoCount--;
	},
	body: (el, memoNum) => {
		query(`#memo${memoNum} .charCount`).innerHTML = el.value.length;
		if(query(`#memo${memoNum} .isSave`).checked) {
			cookieSave(`memo${memoNum}`, el.value);
		}
		// 正規表現からURLを探し、.URLsに追加する
		const URLs = el.value.match(/https?:\/\/\S+\.\S+/g);
		query(`#memo${memoNum} .URLs`).innerHTML = "";
		if(URLs) {
			URLs.forEach(URL => {
				query(`#memo${memoNum} .URLs`).innerHTML += `<li><a href="${URL}" target="_blank">${URL}</a></li>`;
			});
		}
	}
}

document.addEventListener("DOMContentLoaded", () => { // ロード時にCookieを読み込んでメモに反映する
	if(document.cookie != "") {
		const cookies = document.cookie.split("; ");
		cookies.forEach(cookie => {
			if(cookie.slice(0, 4) != "memo") return;
			const [cookieName, cookieValue] = cookie.split("=");
			const isTitleCookie = Boolean(cookieName.split("Title")[1] === ""); // キーに"Title"を含むか
			let cookieMemoNum;
			if(isTitleCookie) {
				cookieMemoNum = Number(cookieName.split("Title")[0].slice(4)); // "Title"の前の"memo"を除いた数字
			} else {
				cookieMemoNum = cookieName.slice(4); // "memo"を除いた数字
			};
			if(cookieMemoNum > memoCount) {
				for(let i=memoCount; i<cookieMemoNum; i++) addMemo();
			}
			if(isTitleCookie) {
				query(`#memo${cookieMemoNum} .memoTitleInput`).value = cookieValue;
				query(`#memo${cookieMemoNum} .memoTitle`).innerHTML = cookieValue;
				const inputEvent = new Event("input", {bubbles: true});
				query(`#memo${cookieMemoNum} .memoTitleInput`).dispatchEvent(inputEvent);
			} else {
				query(`#memo${cookieMemoNum} .body`).value = cookieValue;
				query(`#memo${cookieMemoNum} .charCount`).innerHTML = cookieValue.length;
			}
		});
	}
});

const memosParent = query("#memosParent");

memosParent.addEventListener("click", event => {
	const targetMemoNum = elementBelongMemoNum(event.target);
	const triggeredElement = event.target.className;
	if(triggeredElement == "copyBt" || triggeredElement == "searchBt" || triggeredElement == "replaceBt" || triggeredElement == "deleteMemoBt" || triggeredElement == "deleteMemoCancelBt" || triggeredElement == "deleteMemoYesBt") {
		ELEMENT_EVENTS[triggeredElement](event.target, targetMemoNum);
	}
});

memosParent.addEventListener("input", event => {
	const targetMemoNum = elementBelongMemoNum(event.target);
	const triggeredElement = event.target.className;
	if(triggeredElement == "memoTitleInput" || triggeredElement == "replaceFrom" || triggeredElement == "replaceTo" || triggeredElement == "body") {
		ELEMENT_EVENTS[triggeredElement](event.target, targetMemoNum);
	}
});

memosParent.addEventListener("change", event => {
	const targetMemoNum = elementBelongMemoNum(event.target);
	const triggeredElement = event.target.className;
	if(triggeredElement == "isSave") {
		ELEMENT_EVENTS[triggeredElement](event.target, targetMemoNum);
	}
});

query("#addMemoBt").addEventListener("click", () => {
	addMemo();
});