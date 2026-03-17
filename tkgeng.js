console.log("=====================================");
console.log("   WELCOME TO TKG ENG CLASS   ");
console.log("=====================================\n");

const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let users = {};
let currentUser = null;
let autoLoginUser = null;

// 파일에서 사용자 정보 불러오기
if (fs.existsSync("users.json")) {
    users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
    if (users.autoLoginUser) {
        autoLoginUser = users.autoLoginUser;
        currentUser = users[autoLoginUser];
        console.log(`✅ 자동 로그인: ${currentUser.name}님, 환영합니다!`);
        logLogin(currentUser);
        startExam();
    }
}

// 로그인 기록 저장
function logLogin(user) {
    const now = new Date();
    console.log(`📅 로그인 시간: ${now.toLocaleString()}`);
    if (!users[user.id].logs) users[user.id].logs = [];
    users[user.id].logs.push(now.toLocaleString());
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

// 가입
function signUp() {
    rl.question("사번을 입력하세요: ", (id) => {
        rl.question("이름을 입력하세요: ", (name) => {
            rl.question("비밀번호를 입력하세요: ", (password) => {
                users[id] = { id, name, password, logs: [] };
                fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
                console.log(`✅ 가입 완료! ${name}님, 환영합니다.`);
                loginUser();
            });
        });
    });
}

// 사용자 로그인
function loginUser() {
    rl.question("사번을 입력하세요: ", (id) => {
        rl.question("비밀번호를 입력하세요: ", (password) => {
            if (users[id] && users[id].password === password) {
                currentUser = users[id];
                console.log(`✅ 로그인 성공! ${currentUser.name}님, 시험을 시작합니다.`);
                console.log("[ ] 자동로그인 설정 (체크하려면 y 입력)");
                rl.question("자동로그인 설정하시겠습니까? (y/n): ", (ans) => {
                    if (ans.toLowerCase() === "y") {
                        users.autoLoginUser = id;
                        fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
                        console.log("📌 자동로그인이 설정되었습니다.");
                    }
                    logLogin(currentUser);
                    startExam();
                });
            } else {
                console.log("❌ 로그인 실패. 다시 시도하세요.");
                loginUser();
            }
        });
    });
}

// 관리자 로그인
function loginAdmin() {
    rl.question("관리자 아이디를 입력하세요: ", (id) => {
        rl.question("관리자 비밀번호를 입력하세요: ", (password) => {
            if (id === "TKGHR" && password === "TKGHR1030") {
                console.log("✅ 관리자 로그인 성공!");
                adminMenu();
            } else {
                console.log("❌ 관리자 로그인 실패. 다시 시도하세요.");
                loginAdmin();
            }
        });
    });
}

// 관리자 메뉴
function adminMenu() {
    console.log("\n📋 관리자 메뉴:");
    console.log("1. 전체 계정 정보 확인");
    console.log("2. 특정 직원 비밀번호 리셋");
    console.log("3. 종료");

    rl.question("선택하세요: ", (choice) => {
        if (choice === "1") {
            showAllUsers();
            adminMenu();
        } else if (choice === "2") {
            resetPassword();
        } else {
            rl.close();
        }
    });
}

// 전체 계정 정보 확인
function showAllUsers() {
    console.log("\n📋 직원 전체 계정 정보:");
    Object.values(users).forEach(user => {
        if (user.id) {
            console.log(`- 사번: ${user.id}, 이름: ${user.name}, 로그인 기록: ${user.logs ? user.logs.join(", ") : "없음"}`);
        }
    });
}

// 특정 직원 비밀번호 리셋
function resetPassword() {
    rl.question("비밀번호를 리셋할 직원의 사번을 입력하세요: ", (id) => {
        if (users[id]) {
            rl.question("새 비밀번호를 입력하세요: ", (newPassword) => {
                users[id].password = newPassword;
                fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
                console.log(`✅ ${users[id].name}님의 비밀번호가 리셋되었습니다.`);
                adminMenu();
            });
        } else {
            console.log("❌ 해당 사번의 직원이 존재하지 않습니다.");
            adminMenu();
        }
    });
}

// 팝업 메시지 (3초 뒤 자동 사라짐)
function showPopup(message) {
    console.log(`\n📌 팝업: ${message}`);
    setTimeout(() => {
        console.clear();
        console.log("팝업이 자동으로 사라졌습니다.\n");
    }, 3000);
}

// 시험 관련 설정
const totalWords = 400;          // 전체 단어 수 (2섹션 합쳐서 400개)
const sections = 2;
const stepsPerSection = 10;
const questionsPerStep = 15;
const passPerStep = 12;
const passPerSection = 120;

let currentSection = 1;
let currentStep = 1;
let currentQuestion = 0;
let score = 0;
let stepScore = 0;

// 단어 불러오기 (섹션별 JSON 파일)
const section1Words = require("./Data/words_section1.json");
const section2Words = require("./Data/words_section2.json");
let allWords = { ...section1Words, ...section2Words };

// 셔플 함수
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 전체 단어 키 셔플
let wordKeys = shuffleArray(Object.keys(allWords));

function getNextWord() {
    if (wordKeys.length === 0) return null;
    const word = wordKeys.shift();
    return { word, meaning: allWords[word] };
}

function askQuestion() {
    if (currentQuestion < totalWords) {
        const quiz = getNextWord();
        rl.question(`섹션 ${currentSection}, 단계 ${currentStep}, 문제 ${(currentQuestion % questionsPerStep) + 1}: '${quiz.word}' 은 무슨 뜻일까요? `, (answer) => {
            if (answer === quiz.meaning) {
                console.log("✅ 정답입니다!");
                score++;
                stepScore++;
            } else {
                console.log(`❌ 틀렸습니다. 정답은 '${quiz.meaning}'입니다.`);
            }
            currentQuestion++;

            if (currentQuestion % questionsPerStep === 0) {
                console.log(`\n📊 섹션 ${currentSection}, 단계 ${currentStep} 종료! 단계 점수: ${stepScore}/${questionsPerStep}`);
                if (stepScore >= passPerStep) {
                    console.log("🎉 다음 단계로 진행합니다!\n");

                    // ✅ 단계 통과 시 자동 저장
                    users[currentUser.id].progress = {
                        section: currentSection,
                        step: currentStep,
                        score: score
                    };
                    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
                    console.log("💾 진행 상황이 자동 저장되었습니다!");

                    currentStep++;
                    stepScore = 0;
                } else {
                    showPopup("아쉽지만 다시 한번 열공! 할 수 있어요 🙌");
                    resetExam();
                    return;
                }
            }

            if (currentStep > stepsPerSection) {
                console.log(`\n📊 섹션 ${currentSection} 종료! 누적 점수: ${score}/${currentSection * totalWords/sections}`);
                if (score >= passPerSection * currentSection) {
                    if (currentSection < sections) {
                        console.log("🎉 다음 섹션으로 진행합니다!\n");
                        currentSection++;
                        currentStep = 1;
                        stepScore = 0;
                    } else {
                        console.log(`\n🎯 전체 시험 종료! 최종 점수: ${score}/${totalWords}`);
                        rl.close();
                        return;
                    }
                } else {
                    showPopup("아쉽지만 다시 한번 열공! 할 수 있어요 🙌");
                    resetExam();
                    return;
                }
            }

            askQuestion();
        });
    }
}

function resetExam() {
    currentSection = 
