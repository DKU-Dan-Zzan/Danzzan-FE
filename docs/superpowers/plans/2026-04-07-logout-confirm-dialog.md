# Logout Confirm Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마이페이지의 `로그아웃` 클릭 시 즉시 로그아웃하지 않고 확인 다이얼로그를 거쳐 최종 로그아웃을 수행한다.

**Architecture:** 마이페이지(`MyPage.tsx`) 내부에 로컬 UI 상태(`logoutConfirmOpen`)를 추가해 확인 다이얼로그의 open/close를 제어한다. 공통 UI 컴포넌트인 `AlertDialog`를 재사용해 접근성/일관성을 유지하고, 확인 버튼에서 기존 로그아웃 흐름(`authLogout` 호출, `authStore.clear`, 로그인 화면 이동)을 그대로 실행한다.

**Tech Stack:** React 18, React Router 6, Radix AlertDialog(shadcn wrapper), Vitest

---

### Task 1: 로그아웃 확인창 요구사항을 소스 회귀 테스트로 고정 (RED)

**Files:**
- Create: `src/routes/__tests__/myPageLogoutConfirm.source.test.ts`
- Test: `src/routes/__tests__/myPageLogoutConfirm.source.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// 예시 골격
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8");

describe("MyPage logout confirm source", () => {
  it("로그아웃 클릭 시 확인 다이얼로그를 렌더링하도록 소스를 유지한다", () => {
    const source = readSource("src/routes/mypage/MyPage.tsx");
    expect(source).toContain("AlertDialog");
    expect(source).toContain("logoutConfirmOpen");
    expect(source).toContain("setLogoutConfirmOpen(true)");
    expect(source).toContain("정말 로그아웃하시겠어요?");
    expect(source).toContain("AlertDialogCancel");
    expect(source).toContain("AlertDialogAction");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/routes/__tests__/myPageLogoutConfirm.source.test.ts`  
Expected: FAIL (`MyPage.tsx`에 `AlertDialog`, `logoutConfirmOpen` 관련 문자열 없음)

---

### Task 2: MyPage 로그아웃 액션을 확인 다이얼로그 게이트로 변경 (GREEN)

**Files:**
- Modify: `src/routes/mypage/MyPage.tsx`
- Test: `src/routes/__tests__/myPageLogoutConfirm.source.test.ts`

- [ ] **Step 1: Add dialog imports and state**

```ts
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/common/ui/alert-dialog";

const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
```

- [ ] **Step 2: Replace direct logout click with dialog open action**

```tsx
<ListRow
  icon={<LogOut size={18} />}
  label="로그아웃"
  onClick={() => setLogoutConfirmOpen(true)}
  showArrow
/>
```

- [ ] **Step 3: Keep existing logout behavior in confirm handler**

```ts
const handleLogoutConfirm = () => {
  setLogoutConfirmOpen(false);
  void authLogout();
  authStore.clear();
  navigate("/ticket/login", { replace: true });
};
```

- [ ] **Step 4: Render confirmation dialog in MyPage**

```tsx
<AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>로그아웃 확인</AlertDialogTitle>
      <AlertDialogDescription>정말 로그아웃하시겠어요?</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>취소</AlertDialogCancel>
      <AlertDialogAction onClick={handleLogoutConfirm}>로그아웃</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/routes/__tests__/myPageLogoutConfirm.source.test.ts`  
Expected: PASS

---

### Task 3: 회귀 및 경로 안정성 검증

**Files:**
- Test: `src/components/layout/__tests__/AppLayout.test.tsx`
- Test: `src/components/layout/__tests__/Header.test.tsx`
- Test: `src/routes/__tests__/routeLoadingPolicy.source.test.ts`

- [ ] **Step 1: Run focused regression tests**

Run:
`npm run test -- src/components/layout/__tests__/AppLayout.test.tsx src/components/layout/__tests__/Header.test.tsx src/routes/__tests__/routeLoadingPolicy.source.test.ts`

Expected: PASS (라우트/레이아웃 정책 회귀 없음)

- [ ] **Step 2: Run type check**

Run: `npm run typecheck`  
Expected: PASS

---

### Task 4: 수동 QA 체크리스트

**Files:**
- Verify runtime behavior in `/mypage` (student session)

- [ ] **Step 1: Open dialog**

Action: 마이페이지에서 `로그아웃` 클릭  
Expected: 확인 다이얼로그 노출 (`로그아웃 확인`, `정말 로그아웃하시겠어요?`, `취소`, `로그아웃`)

- [ ] **Step 2: Cancel path**

Action: `취소` 클릭  
Expected: 다이얼로그 닫힘, 세션 유지, 현재 페이지 유지

- [ ] **Step 3: Confirm path**

Action: 다이얼로그의 `로그아웃` 클릭  
Expected: 학생 세션 제거 후 `/ticket/login`으로 이동(`replace: true`)

- [ ] **Step 4: Back navigation sanity**

Action: 브라우저 뒤로가기  
Expected: 인증이 필요한 화면에 즉시 복귀되지 않음(세션 클리어 상태 유지)

---

### Task 5: 커밋

**Files:**
- Modify: `src/routes/mypage/MyPage.tsx`
- Create: `src/routes/__tests__/myPageLogoutConfirm.source.test.ts`
- Optional docs update: `docs/superpowers/plans/2026-04-07-logout-confirm-dialog.md`

- [ ] **Step 1: Stage files**

Run:
`git add src/routes/mypage/MyPage.tsx src/routes/__tests__/myPageLogoutConfirm.source.test.ts docs/superpowers/plans/2026-04-07-logout-confirm-dialog.md`

- [ ] **Step 2: Commit**

Run:
`git commit -m "feat(mypage): add logout confirmation dialog"`
