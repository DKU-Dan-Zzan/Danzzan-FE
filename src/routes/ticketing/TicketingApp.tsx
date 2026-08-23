// 역할: 티켓팅 도메인 라우트 트리와 인증 가드를 연결하는 엔트리 라우터입니다.
import { lazy, Suspense } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { cn } from "@/components/common/ui/utils";
import { UserLayout } from "@/components/ticketing/layout/UserLayout";
import { useAuth } from "@/hooks/ticketing/useAuth";
import {
  buildLoginRedirectPath,
  buildReturnTo,
  isRoleAuthenticated,
} from "@/routes/common/authGuard";
import ServiceClosedNotice from "@/routes/common/ServiceClosedNotice";
import { env } from "@/utils/common/env";

const AdminLayout = lazy(() =>
  import("@/components/ticketing/layout/AdminLayout").then((module) => ({
    default: module.AdminLayout,
  })),
);
const TokenRequired = lazy(() => import("@/routes/ticketing/admin/token-required/TokenRequired"));
const NotFoundPage = lazy(() => import("@/routes/ticketing/not-found/NotFoundPage"));

const TICKETING_ROOT_CLASS_NAME = cn(
  "ticketing-root",
  "[--font-size:16px]",
  "[--ticketing-text-button:0.82rem]",
  "[--ticketing-text-button-compact:0.79rem]",
  "[--ticketing-text-badge:0.82rem]",
  "[--ticketing-text-hero-title:1.2rem]",
  "[--ticketing-text-hero-description:0.88rem]",
  "[--ticketing-text-card-title:0.5rem]",
  "[--ticketing-text-card-subtitle:0.9rem]",
  "[--ticketing-text-section-title:0.8rem]",
  "[--ticketing-text-section-body:0.82rem]",
  "[--ticketing-text-section-body-sm:0.74rem]",
  "[--ticketing-text-helper:0.84rem]",
  "[--ticketing-text-step-title:0.92rem]",
  "[--ticketing-text-info-banner-title:0.85rem]",
  "[--ticketing-text-info-banner-body:0.88rem]",
  "[--ticketing-text-paper-title:0.87rem]",
  "[--ticketing-text-queue-label:0.78rem]",
  "[--ticketing-text-queue-value:1.25rem]",
  "[--ticketing-text-ticket-meta:0.86rem]",
  "[--ticketing-text-ticket-footer:0.7rem]",
  "[--ticketing-text-watermark:0.58rem]",
  "[--ticketing-text-state-title:1.3rem]",
  "[--ticketing-text-state-body:0.82rem]",
  "[--ticketing-text-overline:0.7rem]",
  "[--ticketing-text-header-overline:0.62rem]",
  "[--ticketing-text-step-index:0.7125rem]",
  "[--ticketing-text-holder-overline:0.82rem]",
  "[--ticketing-text-paper-status:0.82rem]",
  "[--ticketing-text-paper-label:0.78rem]",
  "[--ticketing-text-paper-value:0.96rem]",
  "[--ticketing-text-paper-queue:1.02rem]",
  "[--ticketing-text-paper-time:0.86rem]",
  "[--ticketing-text-reservation-countdown:1.02rem]",
  "bg-background",
  "text-foreground",
  "[background-color:var(--bg-base)]",
  "[font-size:var(--font-size)]",
  "[&_button]:border-border",
  "[&_button]:outline-ring/50",
  "[&_input]:border-border",
  "[&_input]:outline-ring/50",
  "[&_textarea]:border-border",
  "[&_textarea]:outline-ring/50",
  "[&_select]:border-border",
  "[&_select]:outline-ring/50",
  "[&_[data-slot]]:border-border",
  "[&_[data-slot]]:outline-ring/50",
  "[&_h1]:text-2xl",
  "[&_h1]:font-medium",
  "[&_h1]:leading-[1.5]",
  "[&_h2]:text-xl",
  "[&_h2]:font-medium",
  "[&_h2]:leading-[1.5]",
  "[&_h3]:text-lg",
  "[&_h3]:font-medium",
  "[&_h3]:leading-[1.5]",
  "[&_h4]:text-base",
  "[&_h4]:font-medium",
  "[&_h4]:leading-[1.5]",
  "[&_label]:text-base",
  "[&_label]:font-medium",
  "[&_label]:leading-[1.5]",
  "[&_button]:text-base",
  "[&_button]:font-medium",
  "[&_button]:leading-[1.5]",
  "[&_input]:text-base",
  "[&_input]:font-normal",
  "[&_input]:leading-[1.5]",
);

function TicketingRouteLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-[var(--text-muted)]">
      화면 불러오는 중...
    </div>
  );
}

function RequireAdminAuth() {
  const { session } = useAuth();
  const location = useLocation();
  const returnTo = buildReturnTo(location.pathname, location.search);

  if (env.apiMode === "mock") {
    return <Outlet />;
  }

  if (
    !isRoleAuthenticated({
      accessToken: session.tokens?.accessToken,
      role: session.role,
      requiredRole: "admin",
    })
  ) {
    return (
      <TokenRequired
        loginRedirectPath={buildLoginRedirectPath("/ticket/admin/login", returnTo)}
        returnTo={returnTo}
      />
    );
  }

  return <Outlet />;
}

export default function TicketingApp() {
  return (
    <div className={TICKETING_ROOT_CLASS_NAME}>
      <Suspense fallback={<TicketingRouteLoading />}>
        <Routes>
          <Route index element={
            <ServiceClosedNotice
              titleKey="closed.ticketing.title"
              descriptionKey="closed.ticketing.description"
              actionKey="closed.ticketing.action"
              actionTo="/"
            />
          } />

          <Route element={<UserLayout />}>
            <Route
              path="login"
              element={
                <ServiceClosedNotice
                  titleKey="closed.auth.title"
                  descriptionKey="closed.auth.description"
                  actionKey="closed.auth.action"
                  actionTo="/"
                />
              }
            />
            <Route
              path="reset-password"
              element={
                <ServiceClosedNotice
                  titleKey="closed.auth.title"
                  descriptionKey="closed.auth.description"
                  actionKey="closed.auth.action"
                  actionTo="/"
                />
              }
            />
            <Route
              path="signup"
              element={
                <ServiceClosedNotice
                  titleKey="closed.auth.title"
                  descriptionKey="closed.auth.description"
                  actionKey="closed.auth.action"
                  actionTo="/"
                />
              }
            />
            <Route
              path="ticketing"
              element={
                <ServiceClosedNotice
                  titleKey="closed.ticketing.title"
                  descriptionKey="closed.ticketing.description"
                  actionKey="closed.ticketing.action"
                  actionTo="/"
                />
              }
            />
            <Route
              path="my-ticket"
              element={
                <ServiceClosedNotice
                  titleKey="closed.ticketing.title"
                  descriptionKey="closed.ticketing.description"
                  actionKey="closed.ticketing.action"
                  actionTo="/"
                />
              }
            />
            <Route
              path="myticket"
              element={
                <ServiceClosedNotice
                  titleKey="closed.ticketing.title"
                  descriptionKey="closed.ticketing.description"
                  actionKey="closed.ticketing.action"
                  actionTo="/"
                />
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route
            path="admin"
            element={
              <ServiceClosedNotice
                titleKey="closed.ticketing.title"
                descriptionKey="closed.ticketing.description"
                actionKey="closed.ticketing.action"
                actionTo="/"
              />
            }
          />
          <Route
            path="admin/login"
            element={
              <ServiceClosedNotice
                titleKey="closed.ticketing.title"
                descriptionKey="closed.ticketing.description"
                actionKey="closed.ticketing.action"
                actionTo="/"
              />
            }
          />
          <Route path="admin/*" element={<RequireAdminAuth />}>
            <Route element={<AdminLayout />}>
              <Route
                path="wristband"
                element={
                  <ServiceClosedNotice
                    titleKey="closed.ticketing.title"
                    descriptionKey="closed.ticketing.description"
                    actionKey="closed.ticketing.action"
                    actionTo="/"
                  />
                }
              />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
}
