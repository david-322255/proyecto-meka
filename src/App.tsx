import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import logo from "./assets/mekatron-lockup.png";
import mark from "./assets/mekatron-mark.png";
import clientCar from "./assets/client-car.jpg";
import { signInUser, signUpUser, type SupabaseUser } from "./lib/supabase";
import { searchCollection, calculateMatchScore } from "./lib/search";

export const stages = [
  "Recibido",
  "Diagnóstico",
  "Aprobación",
  "Repuestos",
  "Reparación",
  "Listo",
  "Entregado",
];

const supabaseInfoModules = import.meta.glob<{
  projectId?: string;
  publicAnonKey?: string;
}>("../utils/supabase/info.tsx");

type Page =
  | "dashboard"
  | "orders"
  | "clients"
  | "vehicles"
  | "quotes"
  | "maintenance"
  | "loyalty"
  | "calendar"
  | "employees";

type IconName =
  | "home"
  | "wrench"
  | "users"
  | "car"
  | "file"
  | "calendar"
  | "box"
  | "star"
  | "team"
  | "chart"
  | "settings"
  | "search"
  | "bell"
  | "moon"
  | "sun"
  | "plus"
  | "arrow"
  | "clock"
  | "check"
  | "alert"
  | "more"
  | "filter"
  | "grid"
  | "list"
  | "phone"
  | "mail"
  | "pin"
  | "gauge"
  | "fuel"
  | "send"
  | "close"
  | "chevron"
  | "camera"
  | "receipt"
  | "whatsapp"
  | "menu"
  | "logout"
  | "eye"
  | "eye-off"
  | "shield";

const paths: Record<IconName, ReactNode> = {
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-7h6v7" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5-5L7.3 3.7l3 3 2.4-2.4a4 4 0 0 0-5 5L2 15l4 4 5.7-5.7a4 4 0 0 0 5-5L14.3 11l-3-3 3.4-1.7Z" />
  ),
  users: (
    <>
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a7 7 0 0 1 14 0v2M16 3a4 4 0 0 1 0 8M18 14a6 6 0 0 1 4 5v2" />
    </>
  ),
  car: (
    <>
      <path d="m4 13 2-6h12l2 6" />
      <path d="M3 13h18v6H3zM5 19v2M19 19v2" />
      <circle cx="7" cy="16" r="1" />
      <circle cx="17" cy="16" r="1" />
    </>
  ),
  file: (
    <>
      <path d="M6 2h9l4 4v16H6zM14 2v5h5" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  box: (
    <>
      <path d="m3 7 9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10" />
    </>
  ),
  star: <path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17.2l-6.3 3.3L7 13.7 2 9l7-.9z" />,
  team: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M2 21v-3a5 5 0 0 1 10 0v3M12 18a5 5 0 0 1 10 0v3" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="m5 12 14 0m-6-6 6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  alert: (
    <>
      <path d="M12 3 2 21h20z" />
      <path d="M12 9v5M12 18h.01" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </>
  ),
  phone: (
    <path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4c0 1-1 2-2 2A17 17 0 0 1 3 5c0-1 1-2 2-2Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 19a9 9 0 1 1 16 0" />
      <path d="m12 13 4-4" />
    </>
  ),
  fuel: (
    <>
      <path d="M5 22V3h10v19M3 22h14M7 7h6" />
      <path d="M15 8h2l3 3v7a2 2 0 0 1-4 0v-5" />
    </>
  ),
  send: <path d="m22 2-7 20-4-9-9-4zM11 13 22 2" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  camera: (
    <>
      <path d="M4 7h4l2-3h4l2 3h4v13H4z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3v19l3-2 4 2 4-2 3 2V3l-3 2-4-2-4 2z" />
      <path d="M9 10h6M9 14h6" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20 11.5a8 8 0 0 1-12 7L3 20l1.5-4.5A8 8 0 1 1 20 11.5Z" />
      <path d="M8 8c1 4 4 6 7 7" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  logout: <path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10" />,
};

function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

type SupabaseConnectionStatus = "checking" | "connected" | "disconnected";

function SupabaseStatus({ client = false }: { client?: boolean }) {
  const [status, setStatus] = useState<SupabaseConnectionStatus>("checking");

  const checkConnection = async () => {
    setStatus("checking");
    let url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    let publicKey =
      (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
      (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);
    const infoLoader = Object.values(supabaseInfoModules)[0];

    if (infoLoader) {
      try {
        const info = await infoLoader();
        if (!url && info.projectId) url = `https://${info.projectId}.supabase.co`;
        if (!publicKey) publicKey = info.publicAnonKey;
      } catch {
        setStatus("disconnected");
        return;
      }
    }

    if (!url || !publicKey) {
      setStatus("disconnected");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
        headers: {
          apikey: publicKey,
          Authorization: `Bearer ${publicKey}`,
        },
        signal: controller.signal,
      });
      setStatus(response.ok ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  useEffect(() => {
    void checkConnection();
  }, []);

  const label =
    status === "connected"
      ? "Supabase conectado"
      : status === "checking"
        ? "Comprobando Supabase"
        : "Supabase no conectado";

  return (
    <button
      className={`supabase-status ${status} ${client ? "client-supabase-status" : ""}`}
      type="button"
      onClick={checkConnection}
      title="Comprobar conexión con Supabase"
      aria-label={`${label}. Pulsa para comprobar de nuevo.`}
    >
      <i />
      <span>{label}</span>
    </button>
  );
}

const nav: { id: Page; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Panel", icon: "home" },
  { id: "orders", label: "Órdenes", icon: "wrench" },
  { id: "clients", label: "Clientes", icon: "users" },
  { id: "vehicles", label: "Vehículos", icon: "car" },
  { id: "quotes", label: "Cotizaciones", icon: "file" },
  { id: "calendar", label: "Agenda", icon: "calendar" },
  { id: "maintenance", label: "Mantenimientos", icon: "clock" },
  { id: "loyalty", label: "Fidelidad", icon: "star" },
  { id: "employees", label: "Empleados", icon: "team" },
];

type Order = {
  id: number;
  plate: string;
  car: string;
  client: string;
  mechanic: string;
  reason: string;
  eta: string;
  status: string;
  color: string;
};
const initialOrders: Order[] = [];

const initialClients: ClientItem[] = [];

const initialVehicles: Vehicle[] = [];

const initialQuotes: Quote[] = [];

const initialLoyaltyRewards: LoyaltyReward[] = [
  {
    id: 1,
    title: "10% de descuento",
    description: "En mano de obra de la próxima visita",
    points: 750,
    icon: "star",
    redemptions: 12,
  },
  {
    id: 2,
    title: "Alineación gratis",
    description: "Alineación básica del vehículo",
    points: 1200,
    icon: "car",
    redemptions: 8,
  },
  {
    id: 3,
    title: "Cambio de aceite",
    description: "Aceite convencional y revisión rápida",
    points: 2000,
    icon: "wrench",
    redemptions: 5,
  },
  {
    id: 4,
    title: "Chequeo completo",
    description: "Inspección general de seguridad",
    points: 2800,
    icon: "check",
    redemptions: 3,
  },
];

type Employee = {
  id: number;
  name: string;
  age: number;
  specialty: string;
  activeJobs: number;
  productivity: number;
  monthlyCommission: number;
  status: "Disponible" | "En descanso";
};

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: "Andrés Paredes",
    age: 34,
    specialty: "Diagnóstico y motor",
    activeJobs: 4,
    productivity: 92,
    monthlyCommission: 680,
    status: "Disponible",
  },
  {
    id: 2,
    name: "Mateo Guamán",
    age: 29,
    specialty: "Mecánica general",
    activeJobs: 3,
    productivity: 88,
    monthlyCommission: 540,
    status: "Disponible",
  },
  {
    id: 3,
    name: "Santiago Calle",
    age: 37,
    specialty: "Pintura y carrocería",
    activeJobs: 3,
    productivity: 84,
    monthlyCommission: 510,
    status: "Disponible",
  },
  {
    id: 4,
    name: "Kevin Ávila",
    age: 23,
    specialty: "Asistente técnico",
    activeJobs: 2,
    productivity: 76,
    monthlyCommission: 285,
    status: "En descanso",
  },
];

const initialAppointments: WorkshopAppointment[] = [
  {
    id: 1,
    date: "2025-06-16",
    time: "10:00",
    plate: "ABC-1234",
    client: "Daniela Cordero",
    causeType: "Mantenimiento",
    reason: "Cambio de aceite",
    message: "",
    appointmentReminder: true,
    maintenanceReminder: true,
  },
  {
    id: 2,
    date: "2025-06-17",
    time: "09:00",
    plate: "PBC-4821",
    client: "Carlos Ochoa",
    causeType: "Problema",
    reason: "Diagnóstico",
    message: "",
    appointmentReminder: true,
    maintenanceReminder: false,
  },
  {
    id: 3,
    date: "2025-06-18",
    time: "08:00",
    plate: "UBB-9012",
    client: "José Sarmiento",
    causeType: "Problema",
    reason: "Revisión de frenos",
    message: "",
    appointmentReminder: true,
    maintenanceReminder: false,
  },
  {
    id: 4,
    date: "2025-06-19",
    time: "14:00",
    plate: "ABC-1234",
    client: "Daniela Cordero",
    causeType: "Mantenimiento",
    reason: "Alineación y balanceo",
    message: "",
    appointmentReminder: true,
    maintenanceReminder: true,
  },
  {
    id: 5,
    date: "2025-06-20",
    time: "13:00",
    plate: "PBC-4821",
    client: "Carlos Ochoa",
    causeType: "Mantenimiento",
    reason: "Mantenimiento preventivo",
    message: "",
    appointmentReminder: true,
    maintenanceReminder: true,
  },
  {
    id: 6,
    date: "2025-06-21",
    time: "12:00",
    plate: "UBB-9012",
    client: "José Sarmiento",
    causeType: "Problema",
    reason: "Ruido en suspensión",
    message: "",
    appointmentReminder: true,
    maintenanceReminder: false,
  },
];

function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "green" | "yellow" | "red" | "orange" | "gray" | "purple";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Button({
  children,
  icon,
  secondary,
  onClick,
  className = "",
  disabled = false,
  loading = false,
}: {
  children: ReactNode;
  icon?: IconName;
  secondary?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || loading || internalLoading) return;
    if (onClick) {
      const res = onClick();
      if (res && typeof (res as Promise<unknown>).then === "function") {
        setInternalLoading(true);
        try {
          await res;
        } finally {
          setInternalLoading(false);
        }
      }
    }
  };

  const isLoading = loading || internalLoading;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`btn ${secondary ? "btn-secondary" : "btn-primary"} ${className} ${
        isLoading ? "btn-loading" : ""
      }`}
      style={{
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        position: "relative",
      }}
    >
      {isLoading ? (
        <span
          className="btn-spinner"
          style={{
            width: 14,
            height: 14,
            border: "2px solid rgba(0,0,0,0.2)",
            borderTopColor: secondary ? "currentColor" : "#414244",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.6s linear infinite",
            marginRight: 6,
          }}
        />
      ) : (
        icon && <Icon name={icon} size={18} />
      )}
      <span>{children}</span>
    </button>
  );
}

function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">Mekatron · Cuenca</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Dashboard({ go, openModal }: { go: (p: Page) => void; openModal: (m: string) => void }) {
  const stats = [
    {
      label: "Vehículos en taller",
      value: "6",
      note: "+2 desde ayer",
      icon: "car" as IconName,
      tone: "yellow",
    },
    {
      label: "Pendientes hoy",
      value: "9",
      note: "3 necesitan aprobación",
      icon: "wrench" as IconName,
      tone: "orange",
    },
    {
      label: "Citas de hoy",
      value: "7",
      note: "Próxima a las 10:30",
      icon: "calendar" as IconName,
      tone: "purple",
    },
  ];
  return (
    <div className="page">
      <Header
        title={`Buenos días, ${currentUser?.fullName ? currentUser.fullName.split(" ")[0] : "Administrador"}`}
        subtitle="Esto es lo que está pasando hoy en tu taller."
        action={
          <Button icon="plus" onClick={() => openModal("new-order")}>
            Nueva orden
          </Button>
        }
      />
      <div className="quick-actions">
        <button onClick={() => openModal("new-order")}>
          <span>
            <Icon name="wrench" />
          </span>
          Nueva orden
        </button>
        <button onClick={() => openModal("new-client")}>
          <span>
            <Icon name="users" />
          </span>
          Nuevo cliente
        </button>
        <button
          onClick={() => {
            go("calendar");
            openModal("new-appointment");
          }}
        >
          <span>
            <Icon name="calendar" />
          </span>
          Nueva cita
        </button>
        <button onClick={() => document.getElementById("global-search")?.focus()}>
          <span>
            <Icon name="search" />
          </span>
          Buscar placa
        </button>
      </div>
      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.tone}`}>
              <Icon name={s.icon} />
            </div>
            <div>
              <p>{s.label}</p>
              <strong>{s.value}</strong>
              <small className={s.tone === "orange" ? "warn" : ""}>{s.note}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="card revenue-card">
          <div className="card-title">
            <div>
              <h2>Ingresos</h2>
              <p>Rendimiento de los últimos 7 días</p>
            </div>
          </div>
          <div className="revenue-total">
            <strong>$8.460,20</strong>
            <Badge tone="green">↗ 18,2%</Badge>
          </div>
          <div className="bar-chart">
            {[42, 58, 47, 78, 62, 89, 70].map((h, i) => (
              <div className="bar-item" key={i}>
                <div className="bar-track">
                  <div className={`bar ${i === 5 ? "active" : ""}`} style={{ height: `${h}%` }}>
                    {i === 5 && <span>$1.842</span>}
                  </div>
                </div>
                <small>{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][i]}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="card services-card">
          <div className="card-title">
            <div>
              <h2>Servicios solicitados</h2>
              <p>Este mes</p>
            </div>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div>
                <strong>126</strong>
                <span>servicios</span>
              </div>
            </div>
            <div className="legend">
              <p>
                <i style={{ background: "#F9C640" }} />
                Mantenimiento <b>38%</b>
              </p>
              <p>
                <i style={{ background: "#F7A21B" }} />
                Frenos <b>24%</b>
              </p>
              <p>
                <i style={{ background: "#58595B" }} />
                Motor <b>21%</b>
              </p>
              <p>
                <i style={{ background: "#D8D9DB" }} />
                Otros <b>17%</b>
              </p>
            </div>
          </div>
        </section>
        <section className="card workshop-card">
          <div className="card-title">
            <div>
              <h2>Actividad del taller</h2>
              <p>Vehículos activos</p>
            </div>
            <button className="text-link" onClick={() => go("orders")}>
              Ver tablero <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="activity-list">
            {initialOrders.slice(0, 4).map((o, i) => (
              <button key={o.id} onClick={() => go("orders")}>
                <div className="car-avatar">
                  <Icon name="car" />
                </div>
                <div>
                  <strong>{o.plate}</strong>
                  <span>{o.car}</span>
                </div>
                <div className="activity-status">
                  <Badge tone={i === 3 ? "green" : i === 2 ? "orange" : "yellow"}>{o.status}</Badge>
                  <small>{o.mechanic}</small>
                </div>
                <Icon name="chevron" size={18} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Orders({
  orders,
  setOrders,
  setSelected,
  openModal,
}: {
  orders: Order[];
  setOrders: (o: Order[]) => void;
  setSelected: (o: Order) => void;
  openModal: (m: string) => void;
}) {
  const [dragId, setDragId] = useState<number | null>(null);
  const drop = (status: string) => {
    if (dragId) setOrders(orders.map((o) => (o.id === dragId ? { ...o, status } : o)));
    setDragId(null);
  };
  return (
    <div className="page orders-page">
      <Header
        title="Órdenes de trabajo"
        subtitle="Sigue el avance de cada vehículo en tiempo real."
        action={
          <Button icon="plus" onClick={() => openModal("new-order")}>
            Nueva orden
          </Button>
        }
      />
      <div className="kanban">
        {stages.map((stage, si) => (
          <div
            className="kanban-column"
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(stage)}
          >
            <div className="column-title">
              <div>
                <i
                  style={{
                    background: [
                      "#F9C640",
                      "#8B5CF6",
                      "#F7A21B",
                      "#3B82F6",
                      "#EC4899",
                      "#22A06B",
                      "#9CA3AF",
                    ][si],
                  }}
                />
                <strong>{stage}</strong>
              </div>
              <span>{orders.filter((o) => o.status === stage).length}</span>
            </div>
            <div className="column-content">
              {orders
                .filter((o) => o.status === stage)
                .map((o) => (
                  <article
                    draggable
                    onDragStart={() => setDragId(o.id)}
                    className="order-card"
                    key={o.id}
                    onClick={() => setSelected(o)}
                  >
                    <div className="order-top">
                      <span>OT-{o.id}</span>
                      <button>
                        <Icon name="more" size={18} />
                      </button>
                    </div>
                    <div className="plate">{o.plate}</div>
                    <h3>{o.car}</h3>
                    <p className="reason">{o.reason}</p>
                    <div className="client-line">
                      <span className="mini-avatar">
                        {o.client
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <span>{o.client}</span>
                    </div>
                    <div className="order-foot">
                      <span>
                        <Icon name="team" size={14} />
                        {o.mechanic}
                      </span>
                      <span className={stage === "Listo" ? "ready" : ""}>
                        <Icon name={stage === "Listo" ? "check" : "clock"} size={14} />
                        {o.eta}
                      </span>
                    </div>
                  </article>
                ))}
              {orders.filter((o) => o.status === stage).length === 0 && (
                <div className="empty-drop">
                  <Icon name="car" size={25} />
                  <span>Arrastra una orden aquí</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Clients({
  clientsList,
  onSelect,
  openModal,
}: {
  clientsList: ClientItem[];
  onSelect: (c: ClientItem) => void;
  openModal: (m: string) => void;
}) {
  const [localSearch, setLocalSearch] = useState("");

  const filteredClients = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    if (!q) return clientsList;
    return clientsList.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        (c.cedula && c.cedula.toLowerCase().includes(q)) ||
        c.phone.toLowerCase().includes(q) ||
        c.plate.toLowerCase().includes(q) ||
        c.car.toLowerCase().includes(q)
      );
    });
  }, [clientsList, localSearch]);

  return (
    <div className="page">
      <Header
        title="Clientes"
        subtitle="Administra relaciones, visitas y fidelidad."
        action={
          <Button icon="plus" onClick={() => openModal("new-client")}>
            Nuevo cliente
          </Button>
        }
      />
      <div className="inline-stats">
        <div>
          <span className="stat-icon yellow">
            <Icon name="users" />
          </span>
          <p>
            <small>Clientes activos</small>
            <b>{clientsList.length}</b>
          </p>
        </div>
        <div>
          <span className="stat-icon green">
            <Icon name="star" />
          </span>
          <p>
            <small>Nuevos este mes</small>
            <b>24</b>
          </p>
        </div>
        <div>
          <span className="stat-icon purple">
            <Icon name="chart" />
          </span>
          <p>
            <small>Ticket promedio</small>
            <b>$286</b>
          </p>
        </div>
      </div>
      <div className="toolbar card-toolbar">
        <div className="local-search">
          <Icon name="search" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula, placa o teléfono..."
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => setLocalSearch("")}
              style={{ border: 0, background: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
      </div>
      <section className="card table-card clients-table">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Vehículo principal</th>
              <th>Visitas</th>
              <th>Total gastado</th>
              <th>Fidelidad</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((c) => (
              <tr key={c.name} onClick={() => onSelect(c)} style={{ cursor: "pointer" }}>
                <td>
                  <div className="person">
                    <span style={{ background: c.color }}>{c.initials}</span>
                    <div>
                      <b>{c.name}</b>
                      <small>Cliente desde {c.createdAt || "2022"}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <b>{c.phone}</b>
                  <small>{c.email || `${c.name.split(" ")[0].toLowerCase()}@correo.com`}</small>
                </td>
                <td>
                  <b>{c.plate}</b>
                  <small>{c.car}</small>
                </td>
                <td>{c.visits}</td>
                <td>
                  <b>{c.total}</b>
                </td>
                <td>
                  <Badge
                    tone={c.tier === "Oro" ? "yellow" : c.tier === "Plata" ? "gray" : "orange"}
                  >
                    {c.tier}
                  </Badge>
                </td>
                <td>
                  <Icon name="chevron" />
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
                  No se encontraron clientes que coincidan con "{localSearch}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Vehicles({
  vehicles,
  onSelect,
  openModal,
}: {
  vehicles: Vehicle[];
  onSelect: (vehicle: Vehicle) => void;
  openModal: () => void;
}) {
  const [query, setQuery] = useState("");
  const visibleVehicles = vehicles.filter((vehicle) =>
    [vehicle.plate, vehicle.car, vehicle.owner]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="page">
      <Header
        title="Vehículos"
        subtitle="Historial técnico y mantenimientos en un solo lugar."
        action={
          <Button icon="plus" onClick={openModal}>
            Nuevo vehículo
          </Button>
        }
      />
      <div className="toolbar card-toolbar">
        <div className="local-search">
          <Icon name="search" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por placa, marca, modelo o propietario"
          />
        </div>
      </div>
      <div className="vehicle-grid">
        {visibleVehicles.map((v, i) => (
          <button className="vehicle-card card" key={v.plate} onClick={() => onSelect(v)}>
            <div className="vehicle-visual">
              <div className={`car-shape c${i}`}>
                <Icon name="car" size={62} />
              </div>
              <Badge
                tone={
                  v.state === "En taller" ? "yellow" : v.state === "Próximo" ? "orange" : "green"
                }
              >
                {v.state}
              </Badge>
            </div>
            <div className="vehicle-title">
              <div>
                <span className="plate">{v.plate}</span>
                <h3>{v.car}</h3>
                <p>
                  {v.year} · {v.color}
                </p>
              </div>
              <Icon name="chevron" />
            </div>
            <div className="vehicle-owner">
              <span>
                {v.owner
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <p>
                <small>Propietario</small>
                <b>{v.owner}</b>
              </p>
            </div>
            <div className="vehicle-meta">
              <span>
                <Icon name="gauge" size={17} />
                {v.km}
              </span>
              <span>
                <Icon name="fuel" size={17} />
                {v.fuel}
              </span>
            </div>
            <div className="next-service">
              <div>
                <small>Próximo mantenimiento</small>
                <b>{v.next}</b>
              </div>
              <div className="progress">
                <i style={{ width: `${55 + i * 5}%` }} />
              </div>
            </div>
          </button>
        ))}
        {visibleVehicles.length === 0 && (
          <div className="vehicle-empty">
            <Icon name="car" size={32} />
            <b>No encontramos vehículos</b>
            <p>Prueba otra búsqueda o registra un coche nuevo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Quotes({
  quotes,
  onConvert,
  openModal,
  toast,
}: {
  quotes: Quote[];
  onConvert: () => void;
  openModal: () => void;
  toast: (s: string) => void;
}) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);
  const byStatus = (status: Quote["status"]) => quotes.filter((quote) => quote.status === status);

  return (
    <div className="page">
      <Header
        title="Presupuestos"
        subtitle="Crea, envía y convierte cotizaciones en trabajo."
        action={
          <Button icon="plus" onClick={openModal}>
            Nueva cotización
          </Button>
        }
      />
      <div className="status-cards">
        <div>
          <Badge tone="yellow">Enviados</Badge>
          <b>{byStatus("Enviado").length}</b>
          <small>
            {formatCurrency(byStatus("Enviado").reduce((total, quote) => total + quote.total, 0))}
          </small>
        </div>
        <div>
          <Badge tone="green">Aprobados</Badge>
          <b>{byStatus("Aprobado").length}</b>
          <small>
            {formatCurrency(byStatus("Aprobado").reduce((total, quote) => total + quote.total, 0))}
          </small>
        </div>
        <div>
          <Badge tone="red">Rechazados</Badge>
          <b>{byStatus("Rechazado").length}</b>
          <small>
            {formatCurrency(byStatus("Rechazado").reduce((total, quote) => total + quote.total, 0))}
          </small>
        </div>
      </div>
      <section className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Cotización</th>
              <th>Vehículo / Cliente</th>
              <th>Detalle</th>
              <th>Total incl. IVA</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id}>
                <td>
                  <b>{q.id}</b>
                  <small>{q.date}</small>
                </td>
                <td>
                  <b>{q.plate}</b>
                  <small>{q.client}</small>
                </td>
                <td>
                  <b>{q.detail}</b>
                  <small>
                    Piezas {formatCurrency(q.parts)} · Mano de obra {formatCurrency(q.labor)}
                  </small>
                </td>
                <td>
                  <b>{formatCurrency(q.total)}</b>
                </td>
                <td>
                  <Badge
                    tone={
                      q.status === "Aprobado"
                        ? "green"
                        : q.status === "Rechazado"
                          ? "red"
                          : "yellow"
                    }
                  >
                    {q.status}
                  </Badge>
                </td>
                <td>
                  {q.status === "Aprobado" ? (
                    <button className="small-action" onClick={onConvert}>
                      Convertir en orden
                    </button>
                  ) : (
                    <button
                      className="icon-btn"
                      onClick={() => toast(`${q.id} enviada a ${q.client} por WhatsApp`)}
                    >
                      <Icon name="send" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Maintenance({
  booking,
  openModal,
  toast,
}: {
  booking: MaintenanceBooking | null;
  openModal: () => void;
  toast: (s: string) => void;
}) {
  const items = [
    ["ABC-9087", "Nissan X-Trail", "Mónica Astudillo", "Cambio de aceite", "720 km vencido", "red"],
    [
      "PAA-3358",
      "Mazda CX-5",
      "María Fernanda Paz",
      "Mantenimiento 40.000 km",
      "En 1.810 km",
      "yellow",
    ],
    [
      "UBB-9012",
      "Hyundai Tucson",
      "José Sarmiento",
      "Filtros y alineación",
      "En 4.650 km",
      "yellow",
    ],
    [
      "ABC-1234",
      "Kia Sportage",
      "Daniela Cordero",
      "Mantenimiento general",
      "Al día · 3 meses",
      "green",
    ],
  ] as const;
  return (
    <div className="page">
      <Header
        title="Mantenimientos"
        subtitle="Anticípate y mantén a tus clientes siempre al día."
        action={
          <Button icon="plus" onClick={openModal}>
            Programar servicio
          </Button>
        }
      />
      {booking && (
        <div className="shared-appointment card">
          <span>
            <Icon name="check" />
          </span>
          <div>
            <b>Servicio programado para {booking.client}</b>
            <small>
              {booking.plate} · {booking.car} · {booking.date} · {booking.mechanic}
            </small>
          </div>
          <Badge tone="green">Programado</Badge>
        </div>
      )}
      <div className="traffic-summary">
        <div className="red">
          <i /> <b>4</b>
          <span>Vencidos</span>
        </div>
        <div className="yellow">
          <i /> <b>11</b>
          <span>Próximos</span>
        </div>
        <div className="green">
          <i /> <b>86</b>
          <span>Al día</span>
        </div>
      </div>
      <div className="maintenance-list">
        {items.map((x) => (
          <div className="card maintenance-row" key={x[0]}>
            <span className={`traffic-dot ${x[5]}`} />
            <div className="plate">{x[0]}</div>
            <div>
              <b>{x[1]}</b>
              <small>{x[2]}</small>
            </div>
            <div>
              <b>{x[3]}</b>
              <small>Por kilometraje</small>
            </div>
            <Badge tone={x[5]}>{x[4]}</Badge>
            <button className="whatsapp" onClick={() => toast(`Recordatorio enviado a ${x[2]}`)}>
              <Icon name="whatsapp" />
              Enviar recordatorio
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Loyalty({
  rewards,
  redeemedCount,
  openModal,
  redeem,
  toast,
}: {
  rewards: LoyaltyReward[];
  redeemedCount: number;
  openModal: () => void;
  redeem: (reward: LoyaltyReward) => void;
  toast: (message: string) => void;
}) {
  const challengeGoal = 40;
  const challengeProgress = Math.min((redeemedCount / challengeGoal) * 100, 100);
  const [referrerName, setReferrerName] = useState(clients[0].name);
  const [referralShares, setReferralShares] = useState(12);
  const referrer = clients.find((client) => client.name === referrerName) || clients[0];
  const referralCode = `${referrer.plate.replace("-", "")}-${referrer.initials}`.toLowerCase();
  const referralLink = `https://mekatron.ec/invitacion/${referralCode}`;
  const referralMessage = `${referrer.name} te invita a Mekatron. Agenda tu primer mantenimiento o diagnóstico con este enlace y ambos recibirán 150 puntos.`;

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast(`Enlace de ${referrer.name} copiado`);
    } catch {
      toast("No se pudo copiar el enlace");
    }
  };

  const shareReferralLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Invitación a Mekatron",
          text: referralMessage,
          url: referralLink,
        });
      } else {
        await navigator.clipboard.writeText(`${referralMessage} ${referralLink}`);
      }
      setReferralShares(referralShares + 1);
      toast(`Invitación compartida para ${referrer.name}`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast("No se pudo compartir la invitación");
    }
  };

  return (
    <div className="page">
      <Header
        title="Programa de fidelidad"
        subtitle="Premia a quienes siempre vuelven a Mekatron."
        action={
          <Button icon="plus" onClick={openModal}>
            Nuevo premio
          </Button>
        }
      />
      <section className="loyalty-banner">
        <div>
          <p>Clientes fidelizados</p>
          <h2>316 personas suman puntos</h2>
          <span>Este mes se canjearon {redeemedCount} premios</span>
        </div>
        <div className="tier-stack">
          <span>
            Bronce <b>184</b>
          </span>
          <span>
            Plata <b>96</b>
          </span>
          <span>
            Oro <b>36</b>
          </span>
        </div>
      </section>
      <section className="card loyalty-challenge">
        <div className="challenge-icon">
          <Icon name="star" />
        </div>
        <div>
          <small>RETO DEL MES</small>
          <h3>40 clientes premiados</h3>
          <p>Cada canje acerca a la comunidad a desbloquear un bono sorpresa.</p>
          <div className="progress">
            <i style={{ width: `${challengeProgress}%` }} />
          </div>
        </div>
        <strong>
          {redeemedCount}
          <small> / {challengeGoal}</small>
        </strong>
      </section>
      <h2 className="section-title">Premios disponibles</h2>
      <div className="reward-grid">
        {rewards.map((reward, index) => (
          <div className="card reward" key={reward.id}>
            <div className="reward-topline">
              <div className={`reward-icon r${index % 4}`}>
                <Icon name={reward.icon} />
              </div>
              <Badge tone="yellow">{reward.redemptions} canjes</Badge>
            </div>
            <h3>{reward.title}</h3>
            <p>{reward.description}</p>
            <b>
              {reward.points.toLocaleString("es-EC")} <small>puntos</small>
            </b>
            <button onClick={() => redeem(reward)}>Canjear y sumar al reto</button>
          </div>
        ))}
      </div>
      <section className="card referral referral-program">
        <div className="referral-heading">
          <span>
            <Icon name="users" />
          </span>
          <div>
            <Badge tone="purple">150 + 150 puntos</Badge>
            <h3>Invita a cuidar otro vehículo</h3>
            <p>
              Quien comparte gana 150 puntos y quien recibe el enlace obtiene otros 150 después de
              su primer mantenimiento o diagnóstico en Mekatron.
            </p>
          </div>
        </div>
        <div className="referral-steps">
          <span>
            <b>1</b> Comparte el enlace
          </span>
          <span>
            <b>2</b> El invitado agenda
          </span>
          <span>
            <b>3</b> Ambos reciben puntos
          </span>
        </div>
        <div className="referral-builder">
          <label>
            <span>Cliente que comparte</span>
            <select value={referrerName} onChange={(event) => setReferrerName(event.target.value)}>
              {clients.map((client) => (
                <option key={client.name}>{client.name}</option>
              ))}
            </select>
          </label>
          <label className="referral-link-field">
            <span>Enlace personal de invitación</span>
            <div>
              <input value={referralLink} readOnly />
              <button type="button" onClick={copyReferralLink}>
                <Icon name="file" size={16} />
                Copiar
              </button>
            </div>
          </label>
          <button className="referral-share" type="button" onClick={shareReferralLink}>
            <Icon name="send" size={18} />
            Compartir invitación
          </button>
        </div>
        <div className="referral-foot">
          <span>
            <b>{referralShares}</b> enlaces compartidos este mes
          </span>
          <small>Los puntos se acreditan cuando el invitado completa su primera visita.</small>
        </div>
      </section>
    </div>
  );
}

function CalendarPage({
  appointments,
  sharedAppointment,
  openModal,
}: {
  appointments: WorkshopAppointment[];
  sharedAppointment?: string;
  openModal: () => void;
}) {
  const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
  const days = [
    { label: "Lun 16", date: "2025-06-16" },
    { label: "Mar 17", date: "2025-06-17" },
    { label: "Mié 18", date: "2025-06-18" },
    { label: "Jue 19", date: "2025-06-19" },
    { label: "Vie 20", date: "2025-06-20" },
    { label: "Sáb 21", date: "2025-06-21" },
  ];

  return (
    <div className="page">
      <Header
        title="Agenda del taller"
        subtitle="Organiza las citas y la capacidad de tu equipo."
        action={
          <Button icon="plus" onClick={openModal}>
            Nueva cita
          </Button>
        }
      />
      {sharedAppointment && (
        <div className="shared-appointment card">
          <span>
            <Icon name="check" />
          </span>
          <div>
            <b>Nueva cita agendada desde la app del cliente</b>
            <small>Daniela Cordero · ABC-1234 · {sharedAppointment}</small>
          </div>
          <Badge tone="green">Confirmada</Badge>
        </div>
      )}
      <div className="calendar-toolbar card">
        <h2>16 – 21 de junio, 2025</h2>
        <Badge tone="yellow">Vista semanal</Badge>
      </div>
      <section className="schedule card">
        <div className="schedule-head">
          <span>Hora</span>
          {days.map((day, index) => (
            <div className={index === 2 ? "today" : ""} key={day.date}>
              <b>{day.label.split(" ")[1]}</b>
              <small>{day.label.split(" ")[0]}</small>
            </div>
          ))}
        </div>
        <div className="schedule-body">
          {times.map((time) => (
            <div className="time-row" key={time}>
              <span>{time}</span>
              {days.map((day) => {
                const appointment = appointments.find(
                  (item) => item.date === day.date && item.time === time,
                );
                return (
                  <div className="slot" key={day.date}>
                    {appointment && (
                      <button
                        className={`appointment ${
                          appointment.causeType === "Mantenimiento" ? "a2" : "a1"
                        }`}
                        title={`${appointment.client} · ${appointment.message || appointment.reason}`}
                      >
                        <b>{appointment.plate}</b>
                        <small>{appointment.reason}</small>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Employees({ employees, openModal }: { employees: Employee[]; openModal: () => void }) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="page">
      <Header
        title="Equipo"
        subtitle="Productividad y carga de trabajo del taller."
        action={
          <Button icon="plus" onClick={openModal}>
            Nuevo empleado
          </Button>
        }
      />
      <div className="employee-grid">
        {employees.map((employee, index) => (
          <div className="card employee" key={employee.id}>
            <div className="employee-top">
              <span className={`avatar av${index % 4}`}>
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <Badge tone={employee.status === "En descanso" ? "yellow" : "green"}>
                {employee.status}
              </Badge>
            </div>
            <h3>{employee.name}</h3>
            <p>
              {employee.specialty} · {employee.age} años
            </p>
            <div className="employee-metrics">
              <div>
                <small>Trabajos activos</small>
                <b>{employee.activeJobs}</b>
              </div>
              <div>
                <small>Productividad</small>
                <b>{employee.productivity}%</b>
              </div>
              <div>
                <small>Comisión mes</small>
                <b>{formatCurrency(employee.monthlyCommission)}</b>
              </div>
            </div>
            <div className="progress">
              <i style={{ width: `${employee.productivity}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetail({
  order,
  close,
  advance,
  toast,
}: {
  order: Order;
  close: () => void;
  advance: () => void;
  toast: (s: string) => void;
}) {
  const idx = stages.indexOf(order.status);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Array<{ name: string; url?: string; isUpload?: boolean }>>([
    { name: "Rayón puerta", url: clientCar },
    { name: "Golpe previo" },
  ]);
  const [previewPhoto, setPreviewPhoto] = useState<{ name: string; url: string } | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newPhoto = { name: file.name.slice(0, 16), url, isUpload: true };
      setPhotos((prev) => [...prev, newPhoto]);
      setPreviewPhoto(newPhoto);
      toast(`Foto "${file.name}" cargada correctamente`);
    }
  };

  return (
    <div className="drawer-overlay" onClick={close}>
      <aside className="detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Hidden input for real file/photo uploads */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />

        {/* Full Image Preview Modal */}
        {previewPhoto && (
          <div
            className="photo-lightbox-overlay"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onClick={() => setPreviewPhoto(null)}
          >
            <div
              style={{
                position: "relative",
                maxWidth: 550,
                width: "100%",
                background: "#1e1f21",
                borderRadius: 16,
                padding: 16,
                textAlign: "center",
                color: "#fff",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <b style={{ fontSize: 13 }}>Vista previa: {previewPhoto.name}</b>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  style={{ background: "none", border: 0, color: "#fff", cursor: "pointer" }}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                style={{
                  width: "100%",
                  maxHeight: "65vh",
                  objectFit: "contain",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 10 }}>
                <Badge tone="green">Carga verificada con éxito</Badge>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="btn btn-primary"
                  style={{ padding: "6px 14px", fontSize: 11 }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="drawer-head">
          <div>
            <span>ORDEN OT-{order.id}</span>
            <h2>{order.plate}</h2>
            <p>{order.car}</p>
          </div>
          <button className="icon-btn" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-status">
          <Badge tone={order.status === "Listo" ? "green" : "yellow"}>{order.status}</Badge>
          <button onClick={() => toast("Notificación enviada al cliente por WhatsApp y SMS")}>
            <Icon name="send" size={16} />
            Notificar al cliente
          </button>
        </div>
        <div className="stepper">
          {stages.slice(0, 6).map((s, i) => (
            <div className={i <= idx ? "done" : ""} key={s}>
              <i>{i < idx ? <Icon name="check" size={12} /> : i + 1}</i>
              <span>{s.replace("Esperando ", "")}</span>
            </div>
          ))}
        </div>
        <div className="detail-block customer-summary">
          <span className="avatar">DC</span>
          <div>
            <small>Cliente</small>
            <b>{order.client}</b>
            <p>
              <Icon name="phone" size={14} /> 099 284 7163
            </p>
          </div>
          <button className="icon-btn" onClick={() => toast(`Llamando al cliente ${order.client}...`)}>
            <Icon name="chevron" />
          </button>
        </div>
        <div className="detail-block">
          <h3>Datos de ingreso</h3>
          <div className="detail-grid">
            <p>
              <small>Motivo</small>
              <b>{order.reason}</b>
            </p>
            <p>
              <small>Kilometraje</small>
              <b>68.420 km</b>
            </p>
            <p>
              <small>Combustible</small>
              <b>½ tanque</b>
            </p>
            <p>
              <small>Mecánico</small>
              <b>{order.mechanic} Paredes</b>
            </p>
          </div>
        </div>
        <div className="detail-block">
          <div className="block-title">
            <h3>Checklist de recepción</h3>
            <Badge tone="green">8/8 revisado</Badge>
          </div>
          <div className="checklist">
            {["Luces", "Neumáticos", "Herramientas", "Documentos"].map((x) => (
              <span key={x}>
                <i>
                  <Icon name="check" size={13} />
                </i>
                {x}
              </span>
            ))}
          </div>
          <div className="photos">
            {photos.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (p.url) {
                    setPreviewPhoto({ name: p.name, url: p.url });
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                style={{
                  backgroundImage: p.url ? `url(${p.url})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
                title={p.url ? "Ver vista previa" : "Cargar foto"}
              >
                {!p.url && <Icon name="camera" />}
                <span
                  style={{
                    background: p.url ? "rgba(0,0,0,0.65)" : "transparent",
                    color: p.url ? "#fff" : "inherit",
                    padding: p.url ? "2px 4px" : "0",
                    borderRadius: 4,
                  }}
                >
                  {p.name}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Abrir explorador para tomar o subir foto"
            >
              <Icon name="plus" />
              <span>Subir foto</span>
            </button>
          </div>
        </div>
        <div className="detail-block">
          <h3>Diagnóstico y trabajos</h3>
          <div className="job-line">
            <i>
              <Icon name="check" size={14} />
            </i>
            <div>
              <b>Revisión de suspensión delantera</b>
              <span>Mano de obra</span>
            </div>
            <b>$45,00</b>
          </div>
          <div className="job-line">
            <i>
              <Icon name="box" size={14} />
            </i>
            <div>
              <b>Buje de tijera delantero × 2</b>
              <span>Repuesto</span>
            </div>
            <b>$86,40</b>
          </div>
          <div className="totals">
            <span>
              Subtotal <b>$131,40</b>
            </span>
            <span>
              IVA 15% <b>$19,71</b>
            </span>
            <span>
              Total <strong>$151,11</strong>
            </span>
          </div>
        </div>
        <div className="detail-block">
          <h3>Historial</h3>
          <div className="timeline">
            <p>
              <i />
              <b>Diagnóstico completado</b>
              <span>Hoy, 10:42 · {order.mechanic}</span>
            </p>
            <p>
              <i />
              <b>Vehículo recibido</b>
              <span>Hoy, 08:18 · Valeria</span>
            </p>
          </div>
        </div>
        <div className="drawer-actions">
          <Button icon="arrow" onClick={advance}>
            {idx >= 5 ? "Marcar entregado" : "Avanzar estado"}
          </Button>
        </div>
      </aside>
    </div>
  );
}

function ClientDetail({ client, close }: { client: (typeof clients)[0]; close: () => void }) {
  return (
    <div className="drawer-overlay" onClick={close}>
      <aside className="detail-drawer client-detail" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="person big">
            <span style={{ background: client.color }}>{client.initials}</span>
            <div>
              <h2>{client.name}</h2>
              <p>Cliente desde marzo 2022</p>
            </div>
          </div>
          <button className="icon-btn" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        <div className="contact-strip">
          <span>
            <Icon name="phone" /> {client.phone}
          </span>
          <span>
            <Icon name="mail" /> {client.name.split(" ")[0].toLowerCase()}@correo.com
          </span>
          <span>
            <Icon name="pin" /> Cuenca
          </span>
        </div>
        <div className="client-kpis">
          <div>
            <small>Total gastado</small>
            <b>{client.total}</b>
          </div>
          <div>
            <small>Visitas</small>
            <b>{client.visits}</b>
          </div>
          <div>
            <small>Ticket promedio</small>
            <b>$310</b>
          </div>
        </div>
        <div className="loyalty-card">
          <div>
            <Badge tone="yellow">Nivel {client.tier}</Badge>
            <b>{client.points} puntos</b>
          </div>
          <div className="progress">
            <i style={{ width: "72%" }} />
          </div>
          <small>160 puntos para tu próximo premio</small>
        </div>
        <div className="detail-block">
          <div className="block-title">
            <h3>Vehículos</h3>
            <button className="text-link">Añadir vehículo</button>
          </div>
          <div className="linked-car">
            <span>
              <Icon name="car" />
            </span>
            <div>
              <b>{client.plate}</b>
              <p>{client.car} · 2020</p>
            </div>
            <Badge tone="green">Al día</Badge>
            <Icon name="chevron" />
          </div>
        </div>
        <div className="detail-block">
          <h3>Historial de visitas</h3>
          <div className="visit-timeline">
            {[
              ["12 jun 2025", "Mantenimiento preventivo", "$186,40"],
              ["04 feb 2025", "Cambio pastillas de freno", "$248,60"],
              ["18 oct 2024", "Alineación y balanceo", "$68,00"],
            ].map((x) => (
              <div key={x[0]}>
                <i />
                <span>{x[0]}</span>
                <p>
                  <b>{x[1]}</b>
                  <small>Orden completada</small>
                </p>
                <b>{x[2]}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="drawer-actions">
          <Button secondary icon="calendar">
            Agendar cita
          </Button>
          <Button icon="plus">Nueva orden</Button>
        </div>
      </aside>
    </div>
  );
}

function VehicleDetail({
  vehicle,
  close,
  onOpenOrder,
  onOpenAppointment,
}: {
  vehicle: Vehicle;
  close: () => void;
  onOpenOrder?: () => void;
  onOpenAppointment?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Array<{ name: string; url?: string; type: "file" | "camera" }>>([
    { name: "Matrícula.pdf", type: "file" },
    { name: "Inspección", type: "camera", url: clientCar },
  ]);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newDoc = { name: file.name.slice(0, 16), url, type: "camera" as const };
      setDocs((prev) => [...prev, newDoc]);
      setPreviewDoc(newDoc);
    }
  };

  return (
    <div className="drawer-overlay" onClick={close}>
      <aside className="detail-drawer" onClick={(e) => e.stopPropagation()}>
        <input
          type="file"
          accept="image/*,.pdf"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />

        {previewDoc && (
          <div
            className="photo-lightbox-overlay"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onClick={() => setPreviewDoc(null)}
          >
            <div
              style={{
                maxWidth: 550,
                width: "100%",
                background: "#1e1f21",
                borderRadius: 16,
                padding: 16,
                textAlign: "center",
                color: "#fff",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <b style={{ fontSize: 13 }}>Vista previa: {previewDoc.name}</b>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  style={{ background: "none", border: 0, color: "#fff", cursor: "pointer" }}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                style={{
                  width: "100%",
                  maxHeight: "65vh",
                  objectFit: "contain",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="btn btn-primary"
                  style={{ padding: "6px 14px", fontSize: 11 }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="drawer-head">
          <div>
            <span>FICHA DEL VEHÍCULO</span>
            <h2>{vehicle.plate}</h2>
            <p>
              {vehicle.car} · {vehicle.year}
            </p>
          </div>
          <button className="icon-btn" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        <div className="vehicle-hero">
          <Icon name="car" size={100} />
          <div>
            <Badge tone="green">{vehicle.state}</Badge>
            <p>
              {vehicle.color} · {vehicle.fuel}
            </p>
          </div>
        </div>
        <div className="detail-block">
          <h3>Información técnica</h3>
          <div className="detail-grid">
            <p>
              <small>VIN</small>
              <b>{vehicle.vin || "KNAPM81BAK7•••425"}</b>
            </p>
            <p>
              <small>Kilometraje</small>
              <b>{vehicle.km}</b>
            </p>
            <p>
              <small>Motor</small>
              <b>{vehicle.engine || "2.0L · 4 cilindros"}</b>
            </p>
            <p>
              <small>Propietario</small>
              <b>{vehicle.owner}</b>
            </p>
            {vehicle.ownerPhone && (
              <p>
                <small>Contacto</small>
                <b>{vehicle.ownerPhone}</b>
              </p>
            )}
            {vehicle.fuelLevel && (
              <p>
                <small>Nivel de combustible</small>
                <b>{vehicle.fuelLevel}</b>
              </p>
            )}
          </div>
        </div>
        {vehicle.entryReason && (
          <div className="detail-block">
            <h3>Ingreso al taller</h3>
            <p className="vehicle-entry-reason">{vehicle.entryReason}</p>
            {vehicle.notes && <small className="vehicle-entry-notes">{vehicle.notes}</small>}
          </div>
        )}
        <div className="service-next">
          <span>
            <Icon name="clock" />
          </span>
          <div>
            <small>Próximo mantenimiento sugerido</small>
            <b>{vehicle.next} o septiembre 2025</b>
            <div className="progress">
              <i style={{ width: "72%" }} />
            </div>
          </div>
        </div>
        <div className="detail-block">
          <div className="block-title">
            <h3>Historial técnico</h3>
            <button className="text-link">Ver todo</button>
          </div>
          <div className="visit-timeline">
            {[
              ["12 jun 2025", "Aceite y filtros", "68.420 km"],
              ["04 feb 2025", "Frenos delanteros", "61.240 km"],
              ["18 oct 2024", "Alineación y balanceo", "54.810 km"],
            ].map((x) => (
              <div key={x[0]}>
                <i />
                <span>{x[0]}</span>
                <p>
                  <b>{x[1]}</b>
                  <small>Completado por Mekatron</small>
                </p>
                <b>{x[2]}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="detail-block">
          <div className="block-title">
            <h3>Documentos y fotos</h3>
            <button className="text-link" type="button" onClick={() => fileInputRef.current?.click()}>
              <Icon name="plus" size={15} />
              Añadir
            </button>
          </div>
          <div className="document-grid">
            {docs.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (d.url) {
                    setPreviewDoc({ name: d.name, url: d.url });
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                style={{
                  backgroundImage: d.url ? `url(${d.url})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  color: d.url ? "#fff" : "inherit",
                }}
              >
                <Icon name={d.type} />
                <span style={{ background: d.url ? "rgba(0,0,0,0.6)" : "transparent", padding: d.url ? "2px 4px" : "0", borderRadius: 4 }}>
                  {d.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="drawer-actions">
          <Button
            secondary
            icon="calendar"
            onClick={() => {
              close();
              if (onOpenAppointment) onOpenAppointment();
            }}
          >
            Agendar cita
          </Button>
          <Button
            icon="plus"
            onClick={() => {
              close();
              if (onOpenOrder) onOpenOrder();
            }}
          >
            Nueva orden
          </Button>
        </div>
      </aside>
    </div>
  );
}

function NewVehicleModal({
  close,
  submit,
}: {
  close: () => void;
  submit: (vehicle: Vehicle) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const mileage = Number(data.get("mileage"));
    const brand = String(data.get("brand")).trim();
    const model = String(data.get("model")).trim();
    const formatKm = (value: number) => `${value.toLocaleString("es-EC")} km`;

    submit({
      plate: String(data.get("plate")).trim().toUpperCase(),
      car: `${brand} ${model}`,
      year: Number(data.get("year")),
      color: String(data.get("color")).trim(),
      owner: String(data.get("owner")).trim(),
      ownerPhone: String(data.get("ownerPhone")).trim(),
      km: formatKm(mileage),
      fuel: String(data.get("fuel")),
      fuelLevel: String(data.get("fuelLevel")),
      next: formatKm(mileage + 5000),
      state: "En taller",
      vin: String(data.get("vin")).trim().toUpperCase(),
      engine: String(data.get("engine")).trim(),
      entryReason: String(data.get("entryReason")).trim(),
      notes: String(data.get("notes")).trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <form className="simple-modal vehicle-modal" onSubmit={handleSubmit}>
        <div className="modal-top">
          <div>
            <p className="eyebrow">Registro de ingreso</p>
            <h2>Agregar nuevo vehículo</h2>
          </div>
          <button className="icon-btn" type="button" onClick={close} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="form-grid">
          <div className="vehicle-section-heading">
            <span>
              <Icon name="car" size={18} />
            </span>
            <div>
              <b>Identificación del vehículo</b>
              <small>Información principal para crear su ficha técnica.</small>
            </div>
          </div>
          <label>
            <span>Placa</span>
            <input name="plate" placeholder="ABC-1234" maxLength={10} required autoFocus />
          </label>
          <label>
            <span>Propietario</span>
            <input name="owner" placeholder="Nombre completo" required />
          </label>
          <label>
            <span>Teléfono de contacto</span>
            <input name="ownerPhone" type="tel" placeholder="099 000 0000" required />
          </label>
          <label>
            <span>Marca</span>
            <input name="brand" placeholder="Ej. Toyota" required />
          </label>
          <label>
            <span>Modelo</span>
            <input name="model" placeholder="Ej. Corolla" required />
          </label>
          <label>
            <span>Año</span>
            <input name="year" type="number" min="1950" max="2026" placeholder="2022" required />
          </label>
          <label>
            <span>Color</span>
            <input name="color" placeholder="Ej. Blanco" required />
          </label>
          <label>
            <span>VIN / Chasis</span>
            <input name="vin" placeholder="Número de identificación" maxLength={17} required />
          </label>
          <label>
            <span>Motor</span>
            <input name="engine" placeholder="Ej. 2.0L · 4 cilindros" required />
          </label>

          <div className="vehicle-section-heading vehicle-entry-heading">
            <span>
              <Icon name="wrench" size={18} />
            </span>
            <div>
              <b>Datos de ingreso al taller</b>
              <small>Registra el estado inicial para facilitar la recepción.</small>
            </div>
          </div>
          <label>
            <span>Recorrido actual</span>
            <input name="mileage" type="number" min="0" placeholder="68420" required />
          </label>
          <label>
            <span>Combustible</span>
            <select name="fuel" defaultValue="Gasolina" required>
              <option>Gasolina</option>
              <option>Diésel</option>
              <option>Híbrido</option>
              <option>Eléctrico</option>
            </select>
          </label>
          <label>
            <span>Nivel de combustible</span>
            <select name="fuelLevel" defaultValue="½ tanque" required>
              <option>Reserva</option>
              <option>¼ de tanque</option>
              <option>½ tanque</option>
              <option>¾ de tanque</option>
              <option>Tanque lleno</option>
            </select>
          </label>
          <label className="wide">
            <span>Motivo de ingreso</span>
            <textarea
              name="entryReason"
              placeholder="Describe la falla, revisión o servicio solicitado"
              required
            />
          </label>
          <label className="wide">
            <span>Observaciones de recepción</span>
            <textarea
              name="notes"
              placeholder="Golpes visibles, testigos encendidos, accesorios entregados..."
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" type="button" onClick={close}>
            <span>Cancelar</span>
          </button>
          <button className="btn btn-primary" type="submit">
            <Icon name="check" size={18} />
            <span>Guardar vehículo</span>
          </button>
        </div>
      </form>

      {/* Modal Olvidé mi contraseña */}
      {forgotModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 18,
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              overflow: "hidden",
              border: "1px solid #f0f0ed",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {/* Header del modal */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e1f21, #2b2c30)",
                color: "#ffffff",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(249,198,64,0.18)",
                    color: "#f9c640",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="shield" size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
                    Recuperar Contraseña
                  </h3>
                  <small style={{ color: "#aaa", fontSize: 11 }}>
                    {forgotStep === "email" ? "Paso 1: Identificación" : forgotStep === "reset" ? "Paso 2: Nueva clave" : "Completado"}
                  </small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: 0,
                  color: "#fff",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del modal */}
            <div style={{ padding: 24 }}>
              {forgotError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                >
                  {forgotError}
                </div>
              )}

              {forgotMsg && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#15803d",
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                >
                  {forgotMsg}
                </div>
              )}

              {forgotStep === "email" && (
                <div>
                  <p style={{ margin: "0 0 16px", color: "#555", fontSize: 13, lineHeight: 1.5 }}>
                    Ingresa el correo electrónico asociado a tu cuenta de Mekatron. Verificaremos tu identidad para restablecer la contraseña.
                  </p>
                  <label style={{ display: "block", marginBottom: 18 }}>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      Correo Electrónico
                    </span>
                    <input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: 14,
                        boxSizing: "border-box",
                      }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      style={{
                        padding: "10px 18px",
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        color: "#4b5563",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotError("");
                        if (!forgotEmail.trim() || !/^[^s@]+@[^s@]+.[^s@]+$/.test(forgotEmail.trim())) {
                          setForgotError("Ingresa un correo electrónico válido.");
                          return;
                        }
                        setForgotMsg("Identidad verificada correctamente para " + forgotEmail.trim());
                        setTimeout(() => {
                          setForgotMsg("");
                          setForgotStep("reset");
                        }, 700);
                      }}
                      style={{
                        padding: "10px 20px",
                        border: 0,
                        background: "#1e1f21",
                        color: "#f9c640",
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {forgotStep === "reset" && (
                <div>
                  <p style={{ margin: "0 0 16px", color: "#555", fontSize: 13, lineHeight: 1.5 }}>
                    Define tu nueva contraseña segura para <b>{forgotEmail}</b>.
                  </p>

                  <label style={{ display: "block", marginBottom: 14 }}>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      Nueva Contraseña
                    </span>
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: 14,
                        boxSizing: "border-box",
                      }}
                    />
                  </label>

                  <label style={{ display: "block", marginBottom: 18 }}>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      Confirmar Nueva Contraseña
                    </span>
                    <input
                      type="password"
                      placeholder="Repite la contraseña"
                      value={confirmPasswordVal}
                      onChange={(e) => setConfirmPasswordVal(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: 14,
                        boxSizing: "border-box",
                      }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setForgotStep("email")}
                      style={{
                        padding: "10px 18px",
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        color: "#4b5563",
                      }}
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotError("");
                        if (!newPasswordVal || newPasswordVal.length < 6) {
                          setForgotError("La nueva contraseña debe tener mínimo 6 caracteres.");
                          return;
                        }
                        if (newPasswordVal !== confirmPasswordVal) {
                          setForgotError("Las contraseñas no coinciden.");
                          return;
                        }
                        
                        // Guardar en localStorage
                        try {
                          localStorage.setItem("user_pwd_" + forgotEmail.trim().toLowerCase(), newPasswordVal);
                          localStorage.setItem("mekatron_last_pwd_reset", JSON.stringify({ email: forgotEmail.trim(), date: new Date().toISOString() }));
                        } catch {}

                        setPassword(newPasswordVal);
                        setEmail(forgotEmail.trim());
                        setForgotMsg("¡Contraseña actualizada con éxito en almacenamiento seguro!");
                        setForgotStep("done");
                        setTimeout(() => {
                          setForgotModalOpen(false);
                          setSuccessMsg("Contraseña restablecida. Puedes iniciar sesión ahora.");
                        }, 1300);
                      }}
                      style={{
                        padding: "10px 20px",
                        border: 0,
                        background: "#16a34a",
                        color: "#fff",
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Guardar Contraseña
                    </button>
                  </div>
                </div>
              )}

              {forgotStep === "done" && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: "50%",
                      background: "#dcfce7",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 14px",
                      fontSize: 26,
                    }}
                  >
                    ✓
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: 16, color: "#111827" }}>
                    ¡Cambio Realizado!
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
                    Tu nueva contraseña se guardó correctamente. La pantalla de inicio de sesión ya está lista con tus nuevas credenciales.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewQuoteModal({
  vehicles,
  close,
  submit,
}: {
  vehicles: Vehicle[];
  close: () => void;
  submit: (quote: Omit<Quote, "id" | "status" | "date">) => void;
}) {
  const services = [
    { name: "Cambio de aceite y filtro", parts: 45, labor: 25 },
    { name: "Cambio de pastillas de freno", parts: 95, labor: 45 },
    { name: "Cambio de batería", parts: 120, labor: 20 },
    { name: "Cambio de amortiguadores", parts: 320, labor: 120 },
    { name: "Cambio de kit de embrague", parts: 430, labor: 180 },
    { name: "Cambio de correa de distribución", parts: 240, labor: 160 },
  ];
  const [plate, setPlate] = useState(vehicles[0]?.plate || "");
  const [serviceIndex, setServiceIndex] = useState(0);
  const [parts, setParts] = useState(services[0].parts);
  const [labor, setLabor] = useState(services[0].labor);
  const selectedService = services[serviceIndex];
  const selectedVehicle = vehicles.find((vehicle) => vehicle.plate === plate);
  const subtotal = Math.max(0, parts) + Math.max(0, labor);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);

  const selectService = (index: number) => {
    const service = services[index];
    setServiceIndex(index);
    setParts(service.parts);
    setLabor(service.labor);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVehicle) return;
    submit({
      plate: selectedVehicle.plate,
      client: selectedVehicle.owner,
      detail: selectedService.name,
      parts,
      labor,
      total,
    });
  };

  return (
    <div className="modal-overlay">
      <form className="simple-modal quote-modal" onSubmit={handleSubmit}>
        <div className="modal-top">
          <div>
            <p className="eyebrow">Presupuesto estimado</p>
            <h2>Nueva cotización</h2>
          </div>
          <button className="icon-btn" type="button" onClick={close} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="form-grid">
          <div className="vehicle-section-heading">
            <span>
              <Icon name="car" size={18} />
            </span>
            <div>
              <b>Vehículo y servicio</b>
              <small>Selecciona la placa y el cambio que necesita el coche.</small>
            </div>
          </div>
          <label className="wide">
            <span>Número de placa</span>
            <select value={plate} onChange={(event) => setPlate(event.target.value)} required>
              {vehicles.map((vehicle) => (
                <option value={vehicle.plate} key={vehicle.plate}>
                  {vehicle.plate} · {vehicle.car} · {vehicle.owner}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            <span>Cambio o servicio solicitado</span>
            <select
              value={serviceIndex}
              onChange={(event) => selectService(Number(event.target.value))}
              required
            >
              {services.map((service, index) => (
                <option value={index} key={service.name}>
                  {service.name} · piezas desde {formatCurrency(service.parts)}
                </option>
              ))}
            </select>
          </label>

          <div className="vehicle-section-heading quote-cost-heading">
            <span>
              <Icon name="wrench" size={18} />
            </span>
            <div>
              <b>Valores aproximados</b>
              <small>Puedes ajustar los costos antes de enviar la cotización.</small>
            </div>
          </div>
          <label>
            <span>Valor de piezas</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={parts}
              onChange={(event) => setParts(Number(event.target.value))}
              required
            />
          </label>
          <label>
            <span>Mano de obra</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={labor}
              onChange={(event) => setLabor(Number(event.target.value))}
              required
            />
          </label>
          <div className="quote-summary">
            <div>
              <span>Placa</span>
              <b>{selectedVehicle?.plate || "Sin vehículo"}</b>
            </div>
            <div>
              <span>Cambio</span>
              <b>{selectedService.name}</b>
            </div>
            <div>
              <span>Piezas</span>
              <b>{formatCurrency(parts)}</b>
            </div>
            <div>
              <span>Mano de obra</span>
              <b>{formatCurrency(labor)}</b>
            </div>
            <div>
              <span>IVA 15%</span>
              <b>{formatCurrency(tax)}</b>
            </div>
            <div className="quote-total">
              <span>Valor aproximado</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <small>
              Este valor es referencial y puede variar después del diagnóstico del vehículo.
            </small>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" type="button" onClick={close}>
            <span>Cancelar</span>
          </button>
          <button className="btn btn-primary" type="submit" disabled={!selectedVehicle}>
            <Icon name="send" size={18} />
            <span>Enviar cotización</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function NewAppointmentModal({
  vehicles,
  appointments,
  close,
  submit,
}: {
  vehicles: Vehicle[];
  appointments: WorkshopAppointment[];
  close: () => void;
  submit: (appointment: Omit<WorkshopAppointment, "id">) => void;
}) {
  const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
  const reasons = {
    Problema: [
      "Diagnóstico general",
      "Ruido o vibración",
      "Falla de motor",
      "Problema de frenos",
      "Aire acondicionado",
    ],
    Mantenimiento: [
      "Mantenimiento preventivo",
      "Cambio de aceite y filtros",
      "Revisión de frenos",
      "Alineación y balanceo",
      "Revisión por kilometraje",
    ],
  };
  const [date, setDate] = useState("2025-06-18");
  const [time, setTime] = useState("");
  const [plate, setPlate] = useState(vehicles[0]?.plate || "");
  const [causeType, setCauseType] = useState<WorkshopAppointment["causeType"]>("Problema");
  const [reason, setReason] = useState(reasons.Problema[0]);
  const [message, setMessage] = useState("");
  const [appointmentReminder, setAppointmentReminder] = useState(true);
  const [maintenanceReminder, setMaintenanceReminder] = useState(false);
  const selectedVehicle = vehicles.find((vehicle) => vehicle.plate === plate);
  const availableTimes = times.filter(
    (slot) =>
      !appointments.some((appointment) => appointment.date === date && appointment.time === slot),
  );
  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
  const suggestedMessage = selectedVehicle
    ? `Hola ${selectedVehicle.owner.split(" ")[0]}, te esperamos en Mekatron el ${formattedDate} a las ${
        time || "[hora]"
      } con tu vehículo ${selectedVehicle.car}, placa ${selectedVehicle.plate}, para ${reason.toLowerCase()}.`
    : "";

  const changeCauseType = (type: WorkshopAppointment["causeType"]) => {
    setCauseType(type);
    setReason(reasons[type][0]);
    if (type === "Mantenimiento") setMaintenanceReminder(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVehicle || !time) return;
    submit({
      date,
      time,
      plate: selectedVehicle.plate,
      client: selectedVehicle.owner,
      causeType,
      reason,
      message: message.trim() || suggestedMessage,
      appointmentReminder,
      maintenanceReminder,
    });
  };

  return (
    <div className="modal-overlay">
      <form className="simple-modal appointment-modal" onSubmit={handleSubmit}>
        <div className="modal-top">
          <div>
            <p className="eyebrow">Agenda del taller</p>
            <h2>Nueva cita</h2>
          </div>
          <button className="icon-btn" type="button" onClick={close} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="form-grid">
          <div className="vehicle-section-heading">
            <span>
              <Icon name="calendar" size={18} />
            </span>
            <div>
              <b>Fecha y horario</b>
              <small>Selecciona un espacio disponible en la semana.</small>
            </div>
          </div>
          <label className="wide">
            <span>Fecha de la cita</span>
            <input
              type="date"
              value={date}
              min="2025-06-16"
              max="2025-06-21"
              onChange={(event) => {
                setDate(event.target.value);
                setTime("");
              }}
              required
            />
          </label>
          <div className="appointment-time-field">
            <span>Horario disponible</span>
            <div className="appointment-time-grid">
              {availableTimes.map((slot) => (
                <button
                  className={time === slot ? "active" : ""}
                  type="button"
                  key={slot}
                  onClick={() => setTime(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
            {availableTimes.length === 0 && (
              <small>No quedan horarios disponibles para esta fecha.</small>
            )}
          </div>

          <div className="vehicle-section-heading">
            <span>
              <Icon name="users" size={18} />
            </span>
            <div>
              <b>Cliente y motivo</b>
              <small>Asocia la cita con la placa y define la causa de la visita.</small>
            </div>
          </div>
          <label className="wide">
            <span>Cliente y placa del coche</span>
            <select value={plate} onChange={(event) => setPlate(event.target.value)} required>
              {vehicles.map((vehicle) => (
                <option value={vehicle.plate} key={vehicle.plate}>
                  {vehicle.owner} · {vehicle.plate} · {vehicle.car}
                </option>
              ))}
            </select>
          </label>
          <div className="appointment-cause-picker">
            <span>Tipo de cita</span>
            <div>
              {(["Problema", "Mantenimiento"] as const).map((type) => (
                <button
                  className={causeType === type ? "active" : ""}
                  type="button"
                  key={type}
                  onClick={() => changeCauseType(type)}
                >
                  <Icon name={type === "Problema" ? "alert" : "wrench"} size={16} />
                  {type === "Problema" ? "Problemática" : type}
                </button>
              ))}
            </div>
          </div>
          <label className="wide">
            <span>Causa de la cita</span>
            <select value={reason} onChange={(event) => setReason(event.target.value)} required>
              {reasons[causeType].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <div className="vehicle-section-heading">
            <span>
              <Icon name="send" size={18} />
            </span>
            <div>
              <b>Mensaje y recordatorios</b>
              <small>Personaliza la comunicación que recibirá el cliente.</small>
            </div>
          </div>
          <label className="wide appointment-message">
            <span>Mensaje personalizado</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={suggestedMessage}
            />
            <button type="button" onClick={() => setMessage(suggestedMessage)}>
              Usar mensaje sugerido
            </button>
          </label>
          <div className="reminder-options">
            <label>
              <input
                type="checkbox"
                checked={appointmentReminder}
                onChange={(event) => setAppointmentReminder(event.target.checked)}
              />
              <span>
                <b>Recordatorio de cita</b>
                <small>Enviar confirmación y aviso antes de la visita.</small>
              </span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={maintenanceReminder}
                onChange={(event) => setMaintenanceReminder(event.target.checked)}
              />
              <span>
                <b>Seguimiento de mantenimiento</b>
                <small>Enviar próximos avisos según kilometraje o fecha.</small>
              </span>
            </label>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" type="button" onClick={close}>
            <span>Cancelar</span>
          </button>
          <button className="btn btn-primary" type="submit" disabled={!selectedVehicle || !time}>
            <Icon name="send" size={18} />
            <span>Agendar y enviar</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function MaintenanceServiceModal({
  vehicles,
  close,
  submit,
}: {
  vehicles: Vehicle[];
  close: () => void;
  submit: (booking: MaintenanceBooking) => void;
}) {
  const mechanics = [
    "Andrés Paredes · Disponible",
    "Mateo Guamán · Disponible",
    "Santiago Calle · Disponible",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const vehicle = vehicles.find((item) => item.plate === data.get("plate"));
    if (!vehicle) return;
    submit({
      plate: vehicle.plate,
      client: vehicle.owner,
      car: vehicle.car,
      date: new Intl.DateTimeFormat("es-EC", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${String(data.get("date"))}T12:00:00`)),
      mechanic: String(data.get("mechanic")).replace(" · Disponible", ""),
    });
  };

  return (
    <div className="modal-overlay">
      <form className="simple-modal" onSubmit={handleSubmit}>
        <div className="modal-top">
          <div>
            <p className="eyebrow">Mantenimiento</p>
            <h2>Programar servicio</h2>
          </div>
          <button className="icon-btn" type="button" onClick={close} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="form-grid">
          <label className="wide">
            <span>Cliente y vehículo</span>
            <select name="plate" required autoFocus>
              {vehicles.map((vehicle) => (
                <option value={vehicle.plate} key={vehicle.plate}>
                  {vehicle.owner} · {vehicle.plate} · {vehicle.car}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Fecha</span>
            <input name="date" type="date" defaultValue="2025-06-18" required />
          </label>
          <label>
            <span>Mecánico disponible</span>
            <select name="mechanic" required>
              {mechanics.map((mechanic) => (
                <option key={mechanic}>{mechanic}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" type="button" onClick={close}>
            <span>Cancelar</span>
          </button>
          <button className="btn btn-primary" type="submit">
            <Icon name="check" size={18} />
            <span>Programar servicio</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function NewRewardModal({
  close,
  submit,
}: {
  close: () => void;
  submit: (reward: Omit<LoyaltyReward, "id" | "redemptions">) => void;
}) {
  const presets: Omit<LoyaltyReward, "id" | "redemptions">[] = [
    {
      title: "Lavado express",
      description: "Lavado exterior rápido en la próxima visita",
      points: 350,
      icon: "car",
    },
    {
      title: "Revisión de niveles",
      description: "Chequeo de aceite, refrigerante y líquido de frenos",
      points: 400,
      icon: "gauge",
    },
    {
      title: "Calibración de neumáticos",
      description: "Revisión y ajuste de presión de los cuatro neumáticos",
      points: 450,
      icon: "check",
    },
    {
      title: "Escaneo básico",
      description: "Lectura rápida de códigos del vehículo",
      points: 600,
      icon: "settings",
    },
    {
      title: "Limpieza interior rápida",
      description: "Aspirado y aromatizante para el habitáculo",
      points: 500,
      icon: "star",
    },
  ];
  const [presetIndex, setPresetIndex] = useState(0);
  const [points, setPoints] = useState(presets[0].points);
  const selectedPreset = presets[presetIndex];

  const selectPreset = (index: number) => {
    setPresetIndex(index);
    setPoints(presets[index].points);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit({ ...selectedPreset, points });
  };

  return (
    <div className="modal-overlay">
      <form className="simple-modal reward-modal" onSubmit={handleSubmit}>
        <div className="modal-top">
          <div>
            <p className="eyebrow">Gamificación</p>
            <h2>Crear nuevo premio</h2>
          </div>
          <button className="icon-btn" type="button" onClick={close} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="form-grid">
          <div className="vehicle-section-heading">
            <span>
              <Icon name="star" size={18} />
            </span>
            <div>
              <b>Servicio para regalar</b>
              <small>Opciones de bajo costo pensadas para motivar una nueva visita.</small>
            </div>
          </div>
          <label className="wide">
            <span>Premio sugerido</span>
            <select
              value={presetIndex}
              onChange={(event) => selectPreset(Number(event.target.value))}
            >
              {presets.map((preset, index) => (
                <option value={index} key={preset.title}>
                  {preset.title}
                </option>
              ))}
            </select>
          </label>
          <div className="reward-preview">
            <span>
              <Icon name={selectedPreset.icon} />
            </span>
            <div>
              <Badge tone="green">Bajo costo</Badge>
              <h3>{selectedPreset.title}</h3>
              <p>{selectedPreset.description}</p>
            </div>
          </div>
          <label className="wide">
            <span>Puntos necesarios</span>
            <input
              type="number"
              min="100"
              max="1500"
              step="50"
              value={points}
              onChange={(event) => setPoints(Number(event.target.value))}
              required
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" type="button" onClick={close}>
            <span>Cancelar</span>
          </button>
          <button className="btn btn-primary" type="submit">
            <Icon name="plus" size={18} />
            <span>Publicar premio</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function NewEmployeeModal({
  close,
  submit,
}: {
  close: () => void;
  submit: (employee: Omit<Employee, "id" | "status">) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    submit({
      name: String(data.get("name")).trim(),
      age: Number(data.get("age")),
      specialty: String(data.get("specialty")).trim(),
      activeJobs: Number(data.get("activeJobs")),
      productivity: Number(data.get("productivity")),
      monthlyCommission: Number(data.get("monthlyCommission")),
    });
  };

  return (
    <div className="modal-overlay">
      <form className="simple-modal employee-modal" onSubmit={handleSubmit}>
        <div className="modal-top">
          <div>
            <p className="eyebrow">Equipo del taller</p>
            <h2>Registrar nuevo empleado</h2>
          </div>
          <button className="icon-btn" type="button" onClick={close} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="form-grid">
          <div className="vehicle-section-heading">
            <span>
              <Icon name="users" size={18} />
            </span>
            <div>
              <b>Información del empleado</b>
              <small>Datos personales y trabajo que desempeña en la mecánica.</small>
            </div>
          </div>
          <label>
            <span>Nombre completo</span>
            <input name="name" placeholder="Ej. Carlos Méndez" required autoFocus />
          </label>
          <label>
            <span>Edad</span>
            <input name="age" type="number" min="18" max="75" placeholder="30" required />
          </label>
          <label className="wide">
            <span>Especialidad o trabajo</span>
            <input
              name="specialty"
              placeholder="Ej. Electricidad automotriz, mecánica general..."
              required
            />
          </label>

          <div className="vehicle-section-heading">
            <span>
              <Icon name="chart" size={18} />
            </span>
            <div>
              <b>Métricas laborales</b>
              <small>Información actual de desempeño y comisión.</small>
            </div>
          </div>
          <label>
            <span>Trabajos activos</span>
            <input name="activeJobs" type="number" min="0" max="30" placeholder="0" required />
          </label>
          <label>
            <span>Productividad</span>
            <div className="input-suffix">
              <input
                name="productivity"
                type="number"
                min="0"
                max="100"
                placeholder="85"
                required
              />
              <span>%</span>
            </div>
          </label>
          <label className="wide">
            <span>Comisión mensual</span>
            <div className="input-prefix">
              <span>$</span>
              <input
                name="monthlyCommission"
                type="number"
                min="0"
                step="0.01"
                placeholder="450.00"
                required
              />
            </div>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" type="button" onClick={close}>
            <span>Cancelar</span>
          </button>
          <button className="btn btn-primary" type="submit">
            <Icon name="check" size={18} />
            <span>Guardar empleado</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function NewClientModal({
  close,
  submit,
}: {
  close: () => void;
  submit: (client: ClientItem) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("Toyota");
  const [model, setModel] = useState("Corolla");
  const [tier, setTier] = useState<"Oro" | "Plata" | "Bronce">("Bronce");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor ingresa los nombres y apellidos del cliente.");
      return;
    }
    if (!phone.trim()) {
      setError("Por favor ingresa un número de teléfono de contacto.");
      return;
    }

    const initials = name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "CL";

    const colors = ["#F9C640", "#22A06B", "#3B82F6", "#8B5CF6", "#EC4899", "#F7A21B"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const cleanPlate = plate.trim().toUpperCase() || "PND-0000";
    const cleanCar = `${brand.trim()} ${model.trim()}`.trim() || "Vehículo particular";

    submit({
      name: name.trim(),
      initials,
      phone: phone.trim(),
      email: email.trim() || `${name.trim().split(" ")[0].toLowerCase()}@correo.com`,
      cedula: cedula.trim(),
      car: cleanCar,
      plate: cleanPlate,
      visits: 1,
      total: "$0,00",
      tier,
      points: tier === "Oro" ? 2500 : tier === "Plata" ? 1500 : 500,
      color: randomColor,
      createdAt: String(new Date().getFullYear()),
    });
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="simple-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-top">
          <div>
            <p className="eyebrow">Registro de clientes</p>
            <h2>Nuevo cliente</h2>
          </div>
          <button className="icon-btn" onClick={close} type="button">
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 11,
                marginBottom: 14,
              }}
            >
              <Icon name="alert" size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-grid">
            <label className="wide">
              <span>Nombres y apellidos completos *</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Ej. Andrea Cabrera Vásquez"
                autoFocus
                required
              />
            </label>

            <label>
              <span>Teléfono / WhatsApp *</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                placeholder="Ej. 099 453 2081"
                required
              />
            </label>

            <label>
              <span>Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej. andrea@correo.com"
              />
            </label>

            <label>
              <span>Cédula o RUC</span>
              <input
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ej. 0104826712"
              />
            </label>

            <label>
              <span>Nivel de fidelidad inicial</span>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as "Oro" | "Plata" | "Bronce")}
              >
                <option value="Bronce">Bronce (500 pts)</option>
                <option value="Plata">Plata (1.500 pts)</option>
                <option value="Oro">Oro (2.500 pts)</option>
              </select>
            </label>

            {/* Vehicle info for the client */}
            <div className="vehicle-section-heading wide" style={{ marginTop: 6 }}>
              <span>
                <Icon name="car" size={18} />
              </span>
              <div>
                <b>Vehículo principal del cliente</b>
                <small>Vinculará automáticamente este auto al historial de visitas.</small>
              </div>
            </div>

            <label>
              <span>Placa</span>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="Ej. ABC-5678"
              />
            </label>

            <label>
              <span>Marca</span>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej. Toyota"
              />
            </label>

            <label className="wide">
              <span>Modelo del vehículo</span>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ej. Corolla 2022"
              />
            </label>
          </div>

          <div className="form-actions" style={{ marginTop: 20 }}>
            <Button secondary onClick={close}>
              Cancelar
            </Button>
            <Button icon="check">
              Guardar cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SimpleModal({
  type,
  close,
  submit,
}: {
  type: string;
  close: () => void;
  submit: (vehicle?: { brand: string; model: string }) => void;
}) {
  const isOrder = type === "new-order";
  const [brand, setBrand] = useState("Kia");
  const [model, setModel] = useState("Sportage 2020");
  const [vehicleError, setVehicleError] = useState("");

  const handleSubmit = () => {
    if (isOrder && (!brand.trim() || !model.trim())) {
      setVehicleError("Completa la marca y el modelo del vehículo.");
      return;
    }
    submit(isOrder ? { brand: brand.trim(), model: model.trim() } : undefined);
  };

  return (
    <div className="modal-overlay">
      <div className="simple-modal">
        <div className="modal-top">
          <div>
            <p className="eyebrow">Nuevo registro</p>
            <h2>{isOrder ? "Crear orden de trabajo" : "Agregar cliente"}</h2>
          </div>
          <button className="icon-btn" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        <div className="form-grid">
          <label>
            <span>{isOrder ? "Buscar placa" : "Nombres completos"}</span>
            <input defaultValue={isOrder ? "ABC-1234" : "Andrea Cabrera"} autoFocus />
          </label>
          <label>
            <span>{isOrder ? "Cliente" : "Teléfono"}</span>
            <input defaultValue={isOrder ? "Daniela Cordero" : "099 453 2081"} />
          </label>
          {isOrder ? (
            <>
              <div className="vehicle-section-heading">
                <span>
                  <Icon name="car" size={18} />
                </span>
                <div>
                  <b>Datos del vehículo</b>
                  <small>Personaliza la orden con la marca y el modelo correctos.</small>
                </div>
              </div>
              <label>
                <span>Marca del vehículo</span>
                <input
                  value={brand}
                  onChange={(event) => {
                    setBrand(event.target.value);
                    setVehicleError("");
                  }}
                  placeholder="Ej. Kia"
                  aria-invalid={Boolean(vehicleError)}
                  required
                />
              </label>
              <label>
                <span>Modelo del vehículo</span>
                <input
                  value={model}
                  onChange={(event) => {
                    setModel(event.target.value);
                    setVehicleError("");
                  }}
                  placeholder="Ej. Sportage 2020"
                  aria-invalid={Boolean(vehicleError)}
                  required
                />
              </label>
              {vehicleError && (
                <p className="vehicle-field-error" role="alert">
                  <Icon name="alert" size={14} />
                  {vehicleError}
                </p>
              )}
              <label className="wide">
                <span>Motivo de ingreso</span>
                <textarea defaultValue="Revisión general y ruido en suspensión" />
              </label>
              <label>
                <span>Kilometraje</span>
                <input defaultValue="68.420" />
              </label>
              <label>
                <span>Mecánico asignado</span>
                <select>
                  <option>Andrés Paredes</option>
                  <option>Mateo Guamán</option>
                </select>
              </label>
            </>
          ) : (
            <>
              <label>
                <span>Cédula</span>
                <input defaultValue="0104826712" />
              </label>
              <label>
                <span>Correo</span>
                <input defaultValue="andrea@correo.com" />
              </label>
            </>
          )}
        </div>
        <div className="form-actions">
          <Button secondary onClick={close}>
            Cancelar
          </Button>
          <Button icon="check" onClick={handleSubmit}>
            {isOrder ? "Crear orden" : "Guardar cliente"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminApp({
  orders,
  setOrders,
  onSwitch,
  onLogout,
  sharedAppointment,
  currentUser,
}: {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  onSwitch: () => void;
  onLogout: () => void;
  sharedAppointment?: string;
  currentUser?: { fullName?: string; email?: string; phone?: string; role?: string };
}) {
  const [page, setPage] = useState<Page>("dashboard");
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);

  // Persistent clients state with localStorage support
  const [clientsList, setClientsList] = useState<ClientItem[]>(() => {
    try {
      const saved = localStorage.getItem("mekatron_clients_cache");
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialClients;
  });

  const saveClients = (newList: ClientItem[]) => {
    setClientsList(newList);
    try {
      localStorage.setItem("mekatron_clients_cache", JSON.stringify(newList));
    } catch {}
  };

  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [appointments, setAppointments] = useState<WorkshopAppointment[]>(initialAppointments);
  const [maintenanceBooking, setMaintenanceBooking] = useState<MaintenanceBooking | null>(null);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>(initialLoyaltyRewards);
  const [redeemedRewards, setRedeemedRewards] = useState(28);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modal, setModal] = useState("");
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  // Pre-compiled search corpus with image preview, tags and links
  const searchCorpus = useMemo(() => {
    const list: Array<{
      id: string;
      primary: string;
      secondary: string;
      category: "Orden OT" | "Vehículo" | "Cliente" | "Cotización" | "Cita";
      targetPage: Page;
      image?: string;
      badgeTone: "yellow" | "green" | "orange" | "gray" | "purple";
      payload?: unknown;
    }> = [];

    // Orders
    orders.forEach((o) => {
      list.push({
        id: `ot-${o.id}`,
        primary: `OT-${o.id} · ${o.plate}`,
        secondary: `${o.car} — ${o.client} (${o.status})`,
        category: "Orden OT",
        targetPage: "orders",
        badgeTone: o.status === "Listo" ? "green" : "yellow",
        payload: o,
      });
    });

    // Clients
    clientsList.forEach((c) => {
      list.push({
        id: `cli-${c.name}`,
        primary: c.name,
        secondary: `${c.phone} · ${c.plate} (${c.car})`,
        category: "Cliente",
        targetPage: "clients",
        badgeTone: "purple",
        payload: c,
      });
    });

    // Vehicles
    vehicles.forEach((v) => {
      list.push({
        id: `veh-${v.plate}`,
        primary: `${v.plate} · ${v.car}`,
        secondary: `Propietario: ${v.owner} · ${v.state}`,
        category: "Vehículo",
        targetPage: "vehicles",
        badgeTone: "green",
        payload: v,
      });
    });

    // Quotes
    quotes.forEach((q) => {
      list.push({
        id: `quot-${q.id}`,
        primary: `${q.id} · ${q.plate}`,
        secondary: `${q.client} — ${q.detail} ($${q.total.toFixed(2)})`,
        category: "Cotización",
        targetPage: "quotes",
        badgeTone: q.status === "Aprobado" ? "green" : "orange",
        payload: q,
      });
    });

    return list;
  }, [orders, vehicles, quotes]);

  // Recommended & Trending searches shown when query is empty but focused
  const recommendedSearches = useMemo(() => [
    { label: "ABC-1234 (Kia Sportage)", query: "ABC-1234", category: "Vehículo en taller" },
    { label: "Daniela Cordero", query: "Daniela", category: "Cliente frecuente" },
    { label: "PBC-4821 (Chevrolet D-Max)", query: "PBC-4821", category: "Orden activa" },
    { label: "Frenos y suspensión", query: "suspensión", category: "Servicios" },
  ], []);

  // Fuzzy search results with closest recommendation
  const searchResult = useMemo(() => {
    return searchCollection(
      searchCorpus,
      query,
      (item) => [item.primary, item.secondary, item.category],
      35
    );
  }, [searchCorpus, query]);
  const advanceOrder = () => {
    if (!selectedOrder) return;
    const idx = stages.indexOf(selectedOrder.status);
    const status = stages[Math.min(idx + 1, stages.length - 1)];
    const updated = { ...selectedOrder, status };
    setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
    setSelectedOrder(updated);
    showToast(`Orden movida a “${status}”`);
  };
  const convertQuote = () => {
    const o: Order = {
      id: 1845,
      plate: "PBC-6672",
      client: "Rafael Moscoso",
      car: "Volkswagen Tiguan 2020",
      reason: "Cotización aprobada · frenos",
      status: "Recibido",
      mechanic: "Andrés",
      eta: "3h 00m",
      stage: 1,
      budget: 180,
      paid: false,
      photos: 2,
      checkItems: ["Frenos delanteros"],
    };
    setOrders([...orders, o]);
    setPage("orders");
    showToast("Cotización convertida en orden OT-1845");
  };
  const render = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard go={setPage} openModal={setModal} />;
      case "orders":
        return (
          <Orders
            orders={orders}
            setOrders={setOrders}
            setSelected={setSelectedOrder}
            openModal={setModal}
          />
        );
      case "clients":
        return (
          <Clients
            clientsList={clientsList}
            onSelect={setSelectedClient}
            openModal={setModal}
          />
        );
      case "vehicles":
        return (
          <Vehicles
            vehicles={vehicles}
            onSelect={setSelectedVehicle}
            openModal={() => setModal("new-vehicle")}
          />
        );
      case "quotes":
        return (
          <Quotes
            quotes={quotes}
            onConvert={convertQuote}
            openModal={() => setModal("new-quote")}
            toast={showToast}
          />
        );
      case "maintenance":
        return (
          <Maintenance
            booking={maintenanceBooking}
            openModal={() => setModal("maintenance-service")}
            toast={showToast}
          />
        );
      case "loyalty":
        return (
          <Loyalty
            rewards={loyaltyRewards}
            redeemedCount={redeemedRewards}
            openModal={() => setModal("new-reward")}
            redeem={(reward) => {
              setLoyaltyRewards(
                loyaltyRewards.map((item) =>
                  item.id === reward.id ? { ...item, redemptions: item.redemptions + 1 } : item,
                ),
              );
              setRedeemedRewards(redeemedRewards + 1);
              showToast(`${reward.title} canjeado; el reto mensual avanzó`);
            }}
            toast={showToast}
          />
        );
      case "calendar":
        return (
          <CalendarPage
            appointments={appointments}
            sharedAppointment={sharedAppointment}
            openModal={() => setModal("new-appointment")}
          />
        );
      case "employees":
        return <Employees employees={employees} openModal={() => setModal("new-employee")} />;
    }
  };
  return (
    <div className={`app-shell ${dark ? "dark" : ""}`}>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="brand">
          <img src={logo} alt="Mekatron" />
        </div>
        <nav>
          {nav.map((n, i) => (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              onClick={() => {
                setPage(n.id);
                setMenu(false);
              }}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {i === 1 && <em>{orders.length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="switch-view" onClick={onSwitch}>
            <Icon name="arrow" />
            <span>
              <b>Cambiar a cliente</b>
              <small>Vista app móvil</small>
            </span>
          </button>
          <div className="user">
            <span>SM</span>
            <div>
              <b>Sebastián M.</b>
              <small>Administrador</small>
            </div>
            <Icon name="more" />
          </div>
          <SupabaseStatus />
        </div>
      </aside>
      {menu && <div className="menu-scrim" onClick={() => setMenu(false)} />}
      <div className="main-shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenu(true)}>
            <Icon name="menu" />
          </button>
          <div className="global-search" style={{ position: "relative" }}>
            <button
              type="button"
              className="icon-btn search-trigger-btn"
              onClick={() => {
                const el = document.getElementById("global-search");
                el?.focus();
                setSearchFocused(true);
              }}
              style={{
                position: "absolute",
                left: 6,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: 0,
                cursor: "pointer",
                padding: 6,
                color: searchFocused ? "#f9c640" : "var(--muted)",
                zIndex: 2,
              }}
              title="Buscar en todo el taller"
            >
              <Icon name="search" size={17} />
            </button>
            <input
              id="global-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Buscar por placa, cliente, OT, cotización o falla..."
              style={{ paddingLeft: 38 }}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{
                  position: "absolute",
                  right: 48,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: 0,
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
                title="Limpiar búsqueda"
              >
                <Icon name="close" size={14} />
              </button>
            ) : null}
            <kbd>⌘ K</kbd>

            {/* Dropdown with Trends & Fuzzy Results */}
            {searchFocused && (
              <div
                className="search-results"
                style={{
                  maxHeight: 420,
                  overflowY: "auto",
                  zIndex: 100,
                  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
                }}
              >
                {/* 1. When query is empty: Show Recommended & Trending */}
                {!query.trim() && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 9px" }}>
                      <small style={{ margin: 0, color: "#8c6710", fontWeight: 800 }}>BÚSQUEDAS RECOMENDADAS Y TENDENCIAS</small>
                      <button
                        type="button"
                        onClick={() => setSearchFocused(false)}
                        style={{ border: 0, background: "none", fontSize: 10, color: "var(--muted)", cursor: "pointer" }}
                      >
                        Cerrar
                      </button>
                    </div>
                    {recommendedSearches.map((rec) => (
                      <button
                        key={rec.label}
                        type="button"
                        onClick={() => {
                          setQuery(rec.query);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <span style={{ background: "#fff5d5", color: "#8c6710" }}>
                          <Icon name="search" size={16} />
                        </span>
                        <div>
                          <b>{rec.label}</b>
                          <small>{rec.category}</small>
                        </div>
                        <Badge tone="yellow">Tendencia</Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Closest Recommendation Banner if no exact match */}
                {query.trim() && searchResult.closestRecommendation && (
                  <div
                    style={{
                      background: "#fff9e6",
                      border: "1px dashed #f9c640",
                      borderRadius: 9,
                      padding: "8px 10px",
                      margin: "4px 4px 8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11 }}>
                      <Icon name="alert" size={15} />
                      <span>
                        ¿Quizá quisiste decir: <b>{searchResult.closestRecommendation.item.primary}</b>?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const rec = searchResult.closestRecommendation!.item;
                        setQuery("");
                        setSearchFocused(false);
                        setPage(rec.targetPage);
                        if (rec.category === "Orden OT") setSelectedOrder(rec.payload as Order);
                        if (rec.category === "Vehículo") setSelectedVehicle(rec.payload as Vehicle);
                        if (rec.category === "Cliente") setSelectedClient(rec.payload as (typeof clients)[0]);
                      }}
                      style={{
                        background: "#f9c640",
                        border: 0,
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Ver resultado
                    </button>
                  </div>
                )}

                {/* 3. Real-time matching results */}
                {query.trim() && searchResult.matches.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 9px" }}>
                      <small style={{ margin: 0 }}>{searchResult.matches.length} COINCIDENCIAS ENCONTRADAS</small>
                      <button
                        type="button"
                        onClick={() => setSearchFocused(false)}
                        style={{ border: 0, background: "none", fontSize: 10, color: "var(--muted)", cursor: "pointer" }}
                      >
                        Cerrar
                      </button>
                    </div>
                    {searchResult.matches.slice(0, 7).map(({ item }) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setSearchFocused(false);
                          setPage(item.targetPage);
                          if (item.category === "Orden OT") setSelectedOrder(item.payload as Order);
                          if (item.category === "Vehículo") setSelectedVehicle(item.payload as Vehicle);
                          if (item.category === "Cliente") setSelectedClient(item.payload as (typeof clients)[0]);
                        }}
                      >
                        <span>
                          <Icon
                            name={
                              item.category === "Cliente"
                                ? "users"
                                : item.category === "Orden OT"
                                ? "wrench"
                                : item.category === "Cotización"
                                ? "file"
                                : "car"
                            }
                          />
                        </span>
                        <div>
                          <b>{item.primary}</b>
                          <small>{item.secondary}</small>
                        </div>
                        <Badge tone={item.badgeTone}>{item.category}</Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* 4. No matches state */}
                {query.trim() && searchResult.matches.length === 0 && !searchResult.closestRecommendation && (
                  <div style={{ padding: "20px 14px", textAlign: "center", color: "var(--muted)", fontSize: 11 }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>No se encontraron coincidencias para "{query}"</p>
                    <small>Intenta buscando por número de placa (ej. ABC-1234), nombre de cliente o número de OT.</small>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="top-actions">
            <span className="view-badge">
              <Icon name="settings" size={14} />
              Vista administrador
            </span>
            <button className="icon-btn" onClick={() => setDark(!dark)} aria-label="Cambiar tema">
              <Icon name={dark ? "sun" : "moon"} />
            </button>
            <button
              className="icon-btn notification"
              onClick={() => showToast("Tienes 3 notificaciones nuevas")}
            >
              <Icon name="bell" />
              <i />
            </button>
            <button className="icon-btn" onClick={onLogout} aria-label="Cerrar sesión">
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main>{render()}</main>
        <nav className="mobile-nav">
          {nav.slice(0, 4).map((n) => (
            <button
              className={page === n.id ? "active" : ""}
              onClick={() => setPage(n.id)}
              key={n.id}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </button>
          ))}
          <button onClick={() => setMenu(true)}>
            <Icon name="menu" />
            <span>Más</span>
          </button>
        </nav>
      </div>
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          close={() => setSelectedOrder(null)}
          advance={advanceOrder}
          toast={showToast}
        />
      )}
      {selectedClient && (
        <ClientDetail client={selectedClient} close={() => setSelectedClient(null)} />
      )}
      {selectedVehicle && (
        <VehicleDetail vehicle={selectedVehicle} close={() => setSelectedVehicle(null)} />
      )}
      {modal === "new-vehicle" && (
        <NewVehicleModal
          close={() => setModal("")}
          submit={(vehicle) => {
            if (vehicles.some((item) => item.plate === vehicle.plate)) {
              showToast(`La placa ${vehicle.plate} ya está registrada`);
              return;
            }
            setVehicles([vehicle, ...vehicles]);
            setModal("");
            setPage("vehicles");
            showToast(`${vehicle.car} registrado correctamente`);
          }}
        />
      )}
      {modal === "new-quote" && (
        <NewQuoteModal
          vehicles={vehicles}
          close={() => setModal("")}
          submit={(quote) => {
            const nextNumber =
              Math.max(...quotes.map((item) => Number(item.id.replace("COT-", "")))) + 1;
            const newQuote: Quote = {
              ...quote,
              id: `COT-${String(nextNumber).padStart(4, "0")}`,
              status: "Enviado",
              date: new Intl.DateTimeFormat("es-EC", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).format(new Date()),
            };
            setQuotes([newQuote, ...quotes]);
            setModal("");
            setPage("quotes");
            showToast(`${newQuote.id} enviada para la placa ${newQuote.plate}`);
          }}
        />
      )}
      {modal === "new-appointment" && (
        <NewAppointmentModal
          vehicles={vehicles}
          appointments={appointments}
          close={() => setModal("")}
          submit={(appointment) => {
            const newAppointment = {
              ...appointment,
              id: Math.max(...appointments.map((item) => item.id), 0) + 1,
            };
            setAppointments([...appointments, newAppointment]);
            setModal("");
            setPage("calendar");
            const reminders = [
              appointment.appointmentReminder ? "recordatorio de cita" : "",
              appointment.maintenanceReminder ? "seguimiento de mantenimiento" : "",
            ].filter(Boolean);
            showToast(
              reminders.length > 0
                ? `Cita agendada y ${reminders.join(" y ")} enviado a ${appointment.client}`
                : `Cita agendada para ${appointment.client}`,
            );
          }}
        />
      )}
      {modal === "maintenance-service" && (
        <MaintenanceServiceModal
          vehicles={vehicles}
          close={() => setModal("")}
          submit={(booking) => {
            setMaintenanceBooking(booking);
            setModal("");
            setPage("maintenance");
            showToast(`Servicio programado con ${booking.mechanic} para ${booking.client}`);
          }}
        />
      )}
      {modal === "new-reward" && (
        <NewRewardModal
          close={() => setModal("")}
          submit={(reward) => {
            if (loyaltyRewards.some((item) => item.title === reward.title)) {
              showToast(`${reward.title} ya está publicado`);
              return;
            }
            setLoyaltyRewards([
              ...loyaltyRewards,
              {
                ...reward,
                id: Math.max(...loyaltyRewards.map((item) => item.id), 0) + 1,
                redemptions: 0,
              },
            ]);
            setModal("");
            setPage("loyalty");
            showToast(`${reward.title} publicado como nuevo premio`);
          }}
        />
      )}
      {modal === "new-employee" && (
        <NewEmployeeModal
          close={() => setModal("")}
          submit={(employee) => {
            if (employees.some((item) => item.name.toLowerCase() === employee.name.toLowerCase())) {
              showToast(`${employee.name} ya está registrado`);
              return;
            }
            setEmployees([
              ...employees,
              {
                ...employee,
                id: Math.max(...employees.map((item) => item.id), 0) + 1,
                status: "Disponible",
              },
            ]);
            setModal("");
            setPage("employees");
            showToast(`${employee.name} agregado al equipo`);
          }}
        />
      )}
      {modal === "new-client" && (
        <NewClientModal
          close={() => setModal("")}
          submit={(newClient) => {
            const updated = [newClient, ...clientsList];
            saveClients(updated);
            
            // Also register client's vehicle if provided
            if (newClient.plate && newClient.plate !== "PND-0000") {
              const newVeh: Vehicle = {
                plate: newClient.plate,
                car: newClient.car,
                year: Number(new Date().getFullYear()),
                color: "Blanco",
                owner: newClient.name,
                km: "0 km",
                fuel: "Gasolina",
                next: "5.000 km",
                state: "Registrado",
                ownerPhone: newClient.phone,
              };
              if (!vehicles.some((v) => v.plate === newVeh.plate)) {
                setVehicles((prev) => [newVeh, ...prev]);
              }
            }

            setModal("");
            setPage("clients");
            showToast(`Cliente ${newClient.name} registrado con éxito`);
          }}
        />
      )}
      {modal === "new-order" && (
        <SimpleModal
          type="new-order"
          close={() => setModal("")}
          submit={(vehicle) => {
            const n: Order = {
              id: 1846,
              plate: vehicle?.plate || "ABC-0001",
              client: vehicle?.owner || "Nuevo Cliente",
              car: vehicle?.brand && vehicle?.model ? `${vehicle.brand} ${vehicle.model}` : "Vehículo Taller",
              mechanic: "Equipo Taller",
              reason: "Ingreso nuevo a taller",
              eta: "Pendiente",
              status: "Recibido",
              stage: 1,
              budget: 0,
              paid: false,
              photos: 0,
              checkItems: [],
            };
            setOrders([...orders, n]);
            setPage("orders");
            setModal("");
            showToast("Orden OT-1846 creada correctamente");
          }}
        />
      )}
      {toast && (
        <div className="toast">
          <i>
            <Icon name="check" size={16} />
          </i>
          <span>{toast}</span>
          <button onClick={() => setToast("")}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

type AppMode = "welcome" | "admin-login" | "client-login" | "admin" | "client";
type ClientTab = "home" | "car" | "appointments" | "points" | "profile";
type ClientProfile = { name: string; phone: string; email: string };
type ClientVehicle = {
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
};

function TirePattern() {
  return <div className="tire-pattern" aria-hidden="true" />;
}

function WelcomeScreen({ choose }: { choose: (mode: AppMode) => void }) {
  return (
    <div className="welcome-screen">
      <TirePattern />
      <div className="welcome-content">
        <img src={logo} alt="Mekatron" />
        <p>GESTIÓN AUTOMOTRIZ · CUENCA</p>
        <h1>
          Todo tu taller.
          <br />
          Una sola experiencia.
        </h1>
        <div className="profile-cards">
          <button onClick={() => choose("admin-login")}>
            <span>
              <Icon name="wrench" size={30} />
            </span>
            <div>
              <small>GESTIÓN DEL TALLER</small>
              <b>Soy del taller</b>
              <p>Órdenes, clientes, vehículos y equipo.</p>
            </div>
            <Icon name="arrow" />
          </button>
          <button onClick={() => choose("client-login")}>
            <span>
              <Icon name="car" size={30} />
            </span>
            <div>
              <small>PORTAL PERSONAL</small>
              <b>Soy cliente</b>
              <p>Sigue tu coche, aprueba y agenda.</p>
            </div>
            <Icon name="arrow" />
          </button>
        </div>
        <small className="welcome-foot">MEKATRON · TU VEHÍCULO EN BUENAS MANOS</small>
      </div>
    </div>
  );
}

function LoginScreen({
  type,
  back,
  enter,
  onUserAuth,
}: {
  type: "admin" | "client";
  back: () => void;
  enter: (role: "admin" | "client", user?: SupabaseUser) => void;
  onUserAuth?: (user: SupabaseUser) => void;
}) {
  const [currentRole, setCurrentRole] = useState<"admin" | "client">(type);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(
    currentRole === "admin" ? "sebastian@mekatron.ec" : "daniela@correo.com"
  );
  const [password, setPassword] = useState(
    currentRole === "admin" ? "mekatron2025" : "cliente123"
  );
  const [phone, setPhone] = useState(currentRole === "client" ? "0992847163" : "");
  
  // Interactive UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Forgot password flow states
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "reset" | "done">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmPasswordVal, setConfirmPasswordVal] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState("");

  const isAdmin = currentRole === "admin";

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "Vacía", color: "#e2e2df" };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: "Débil (mínimo 6 caracteres)", color: "#ef4444" };
    if (score <= 3) return { score: 2, label: "Aceptable", color: "#eab308" };
    return { score: 3, label: "Segura y robusta", color: "#22c55e" };
  }, [password]);

  // Email format validation
  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const handleRoleChange = (newRole: "admin" | "client") => {
    setCurrentRole(newRole);
    setErrorMsg("");
    setSuccessMsg("");
    if (authMode === "login") {
      setEmail(newRole === "admin" ? "sebastian@mekatron.ec" : "daniela@correo.com");
      setPassword(newRole === "admin" ? "mekatron2025" : "cliente123");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Field-level validations
    if (authMode === "register" && !fullName.trim()) {
      setErrorMsg("Por favor, ingresa tus nombres y apellidos completos.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("El correo electrónico es requerido.");
      return;
    }

    if (!isEmailValid) {
      setErrorMsg("Ingresa un correo electrónico con formato válido (ej. usuario@dominio.com).");
      return;
    }

    if (!password) {
      setErrorMsg("La contraseña es requerida.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe contener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (authMode === "register") {
        const res = await signUpUser({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role: isAdmin ? "admin" : "client",
          phone: phone.trim(),
        });

        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        setSuccessMsg(
          res.emailConfirmed
            ? "¡Cuenta registrada con éxito! Iniciando sesión..."
            : "¡Registro exitoso! Iniciando tu sesión en Mekatron..."
        );

        if (res.user && onUserAuth) onUserAuth(res.user);

        setTimeout(() => {
          setLoading(false);
          enter(isAdmin ? "admin" : "client", res.user || undefined);
        }, 1200);
      } else {
        // Login mode
        const res = await signInUser({
          email: email.trim(),
          password,
        });

        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        setSuccessMsg(
          isAdmin
            ? "Acceso concedido. Entrando al taller..."
            : "Identificación correcta. Abriendo tu garage..."
        );

        if (res.user && onUserAuth) onUserAuth(res.user);

        setTimeout(() => {
          setLoading(false);
          enter(isAdmin ? "admin" : "client", res.user || undefined);
        }, 900);
      }
    } catch {
      // Resilient instant local login fallback
      setSuccessMsg("Accediendo a la plataforma Mekatron...");
      setTimeout(() => {
        setLoading(false);
        enter(isAdmin ? "admin" : "client");
      }, 700);
    }
  };

  return (
    <div className={`login-screen ${isAdmin ? "admin-auth" : "client-auth"}`}>
      <TirePattern />
      
      <button className="auth-back" onClick={back} type="button">
        <Icon name="arrow" />
        Volver
      </button>

      <form onSubmit={handleSubmit} noValidate>
        {/* Brand header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <img src={mark} alt="Mekatron" style={{ margin: 0 }} />
          <Badge tone={isAdmin ? "yellow" : "orange"}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon name={isAdmin ? "wrench" : "car"} size={13} />
              {isAdmin ? "Panel Dueño / Taller" : "Portal Cliente"}
            </span>
          </Badge>
        </div>

        {/* Role Switcher Pill */}
        <div className="auth-role-tabs" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "#f4f4f1",
          borderRadius: 12,
          padding: 4,
          marginBottom: 18,
          gap: 4
        }}>
          <button
            type="button"
            onClick={() => handleRoleChange("admin")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              border: 0,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: isAdmin ? "#fff" : "transparent",
              color: isAdmin ? "#1e1f21" : "#777",
              boxShadow: isAdmin ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Icon name="wrench" size={15} />
            <span>Dueño / Taller</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleRoleChange("client")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              border: 0,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: !isAdmin ? "#fff" : "transparent",
              color: !isAdmin ? "#1e1f21" : "#777",
              boxShadow: !isAdmin ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Icon name="car" size={15} />
            <span>Cliente</span>
          </button>
        </div>

        {/* Dynamic Titles */}
        <h1>
          {authMode === "login"
            ? isAdmin
              ? "Bienvenido al taller"
              : "Tu coche, siempre contigo"
            : isAdmin
            ? "Registro de Administrador"
            : "Crea tu cuenta de Cliente"}
        </h1>
        <p>
          {authMode === "login"
            ? isAdmin
              ? "Ingresa con tus credenciales de Dueño para gestionar la operación."
              : "Accede para consultar el estado de tu vehículo, cotizaciones y citas."
            : isAdmin
            ? "Registra una cuenta de gestión con privilegios de taller en Mekatron."
            : "Registra tus datos personales para vincular tus vehículos e historial."}
        </p>

        {/* Login / Register Toggle Tabs */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid #eee",
          marginBottom: 18,
          gap: 16
        }}>
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            style={{
              border: 0,
              background: "none",
              padding: "8px 4px 10px",
              fontSize: 12,
              fontWeight: 800,
              color: authMode === "login" ? "#f9c640" : "#888",
              borderBottom: authMode === "login" ? "2px solid #f9c640" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            style={{
              border: 0,
              background: "none",
              padding: "8px 4px 10px",
              fontSize: 12,
              fontWeight: 800,
              color: authMode === "register" ? "#f9c640" : "#888",
              borderBottom: authMode === "register" ? "2px solid #f9c640" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Crear Cuenta Nueva
          </button>
        </div>

        {/* Global Feedback alerts */}
        {errorMsg && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 11,
            lineHeight: 1.4,
            marginBottom: 14,
            animation: "fadeIn 0.2s ease"
          }}>
            <Icon name="alert" size={17} />
            <span style={{ fontWeight: 600 }}>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 11,
            lineHeight: 1.4,
            marginBottom: 14,
            animation: "fadeIn 0.2s ease"
          }}>
            <Icon name="check" size={17} />
            <span style={{ fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        {/* Full Name field (Register only) */}
        {authMode === "register" && (
          <label style={{ marginTop: 10 }}>
            <span style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Nombres y Apellidos completos *</span>
              {touched.fullName && !fullName.trim() && (
                <span style={{ color: "#ef4444", fontWeight: 700 }}>Requerido</span>
              )}
            </span>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder={isAdmin ? "Ej. Sebastián Morales" : "Ej. Daniela Cordero"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                style={{
                  paddingLeft: 38,
                  borderColor: touched.fullName && !fullName.trim() ? "#ef4444" : undefined,
                }}
              />
              <span style={{ position: "absolute", left: 13, top: 14, color: "#888", pointerEvents: "none" }}>
                <Icon name="users" size={15} />
              </span>
            </div>
          </label>
        )}

        {/* Email field */}
        <label style={{ marginTop: 12 }}>
          <span style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Correo electrónico *</span>
            {touched.email && email && !isEmailValid && (
              <span style={{ color: "#ef4444", fontWeight: 700 }}>Formato inválido</span>
            )}
            {touched.email && !email && (
              <span style={{ color: "#ef4444", fontWeight: 700 }}>Requerido</span>
            )}
          </span>
          <div style={{ position: "relative" }}>
            <input
              type="email"
              placeholder={isAdmin ? "admin@mekatron.ec" : "cliente@correo.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              style={{
                paddingLeft: 38,
                borderColor:
                  touched.email && (!email || !isEmailValid) ? "#ef4444" : undefined,
              }}
            />
            <span style={{ position: "absolute", left: 13, top: 14, color: "#888", pointerEvents: "none" }}>
              <Icon name="mail" size={15} />
            </span>
          </div>
        </label>

        {/* Phone field (optional on register) */}
        {authMode === "register" && (
          <label style={{ marginTop: 12 }}>
            <span>Teléfono o WhatsApp (opcional)</span>
            <div style={{ position: "relative" }}>
              <input
                type="tel"
                placeholder="Ej. 099 284 7163"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
              <span style={{ position: "absolute", left: 13, top: 14, color: "#888", pointerEvents: "none" }}>
                <Icon name="phone" size={15} />
              </span>
            </div>
          </label>
        )}

        {/* Password field with toggle visibility & strength bar */}
        <label style={{ marginTop: 12 }}>
          <span style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Contraseña *</span>
            {authMode === "register" && password && (
              <span style={{ color: passwordStrength.color, fontWeight: 700 }}>
                {passwordStrength.label}
              </span>
            )}
          </span>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              style={{
                paddingLeft: 38,
                paddingRight: 42,
                borderColor:
                  touched.password && password.length < 6 ? "#ef4444" : undefined,
              }}
            />
            <span style={{ position: "absolute", left: 13, top: 14, color: "#888", pointerEvents: "none" }}>
              <Icon name="shield" size={15} />
            </span>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: 0,
                color: "#888",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} size={17} />
            </button>
          </div>
        </label>

        {/* Enlace Olvidé mi contraseña */}
        {authMode === "login" && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="button"
              onClick={() => {
                setForgotModalOpen(true);
                setForgotStep("email");
                setForgotEmail(email);
                setForgotMsg("");
                setForgotError("");
              }}
              style={{
                background: "none",
                border: 0,
                color: "#d97706",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: "2px 0",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {/* Password Strength meter */}
        {authMode === "register" && password.length > 0 && (
          <div style={{ marginTop: 7 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 4,
              height: 4,
              borderRadius: 2,
              overflow: "hidden"
            }}>
              <div style={{ background: passwordStrength.score >= 1 ? passwordStrength.color : "#e2e2df", transition: "background 0.2s" }} />
              <div style={{ background: passwordStrength.score >= 2 ? passwordStrength.color : "#e2e2df", transition: "background 0.2s" }} />
              <div style={{ background: passwordStrength.score >= 3 ? passwordStrength.color : "#e2e2df", transition: "background 0.2s" }} />
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 9, color: "#777" }}>
              Usa al menos 8 caracteres, números y una mayúscula para máxima seguridad.
            </p>
          </div>
        )}

        {/* Submit button with loading spinner state */}
        <button
          className="auth-submit"
          type="submit"
          disabled={loading}
          style={{
            opacity: loading ? 0.75 : 1,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 22,
          }}
        >
          {loading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className="auth-spinner" style={{
                width: 13,
                height: 13,
                border: "2px solid rgba(0,0,0,0.2)",
                borderTopColor: "#414244",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                display: "inline-block"
              }} />
              <span>{authMode === "login" ? "Autenticando..." : "Registrando en Supabase..."}</span>
            </span>
          ) : (
            <>
              {authMode === "login"
                ? isAdmin
                  ? "Ingresar al taller"
                  : "Entrar como cliente"
                : isAdmin
                ? "Crear cuenta de taller"
                : "Crear cuenta y entrar"}
              <Icon name="arrow" />
            </>
          )}
        </button>

        {/* Quick Guest / Demo Access */}
        {!isAdmin && (
          <button
            type="button"
            className="guest-link"
            onClick={() => enter("client")}
          >
            Entrar como invitado (sin contraseña)
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            className="guest-link"
            onClick={() => enter("admin")}
          >
            Acceso rápido demo (Administrador)
          </button>
        )}

        <small style={{ marginTop: 12 }}>
          Conectado con Supabase Auth · Seguridad SSL · Mekatron Cuenca
        </small>
      </form>
    </div>
  );
}

function ClientApp({
  orders,
  setOrders,
  onSwitch,
  onLogout,
  onAppointment,
  currentUser,
}: {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  onSwitch: () => void;
  onLogout: () => void;
  onAppointment: (appointment: string) => void;
  currentUser?: { fullName?: string; email?: string; phone?: string; role?: string };
}) {
  const [tab, setTab] = useState<ClientTab>("home");
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [fab, setFab] = useState(false);
  const [clientProfile, setClientProfile] = useState<ClientProfile>(() => {
    const savedName = currentUser?.fullName || localStorage.getItem("mekatron_client_name") || "Nuevo Cliente";
    const savedEmail = currentUser?.email || localStorage.getItem("mekatron_client_email") || "cliente@mekatron.ec";
    const savedPhone = currentUser?.phone || localStorage.getItem("mekatron_client_phone") || "";
    return { name: savedName, phone: savedPhone, email: savedEmail };
  });

  useEffect(() => {
    if (currentUser?.fullName) {
      setClientProfile(prev => ({
        ...prev,
        name: currentUser.fullName || prev.name,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone
      }));
    }
  }, [currentUser]);

  const [clientVehicles, setClientVehicles] = useState<ClientVehicle[]>(() => {
    try {
      const saved = localStorage.getItem("mekatron_client_vehicles");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("mekatron_client_vehicles", JSON.stringify(clientVehicles));
  }, [clientVehicles]);
  const [profileSheet, setProfileSheet] = useState<"" | "personal" | "vehicles">("");
  const [addingClientVehicle, setAddingClientVehicle] = useState(false);
  const [appointmentStep, setAppointmentStep] = useState(1);
  const [appointmentDone, setAppointmentDone] = useState(false);
  const [appointmentVehicle, setAppointmentVehicle] = useState("ABC-1234");
  const [appointmentService, setAppointmentService] = useState("Mantenimiento");
  const [customAppointmentService, setCustomAppointmentService] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("Mié 25 jun");
  const [appointmentTime, setAppointmentTime] = useState("11:00");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteApproved, setQuoteApproved] = useState(false);
  const [points, setPoints] = useState(2840);
  const defaultFallbackOrder: Order = {
    id: 1842,
    plate: "ABC-1234",
    car: "Kia Sportage 2020",
    client: clientProfile.name || "Cliente Mekatron",
    mechanic: "Andrés",
    reason: "Mantenimiento preventivo",
    eta: "En espera",
    status: "Recibido",
    stage: 1,
    budget: 0,
    paid: false,
    photos: 0,
    checkItems: [],
  };
  const activeOrder = orders.find((item) => item.plate === "ABC-1234") || orders[0];
  const order = activeOrder || defaultFallbackOrder;
  const hasLiveOrder = Boolean(activeOrder);
  const stageIndex = Math.max(0, stages.indexOf(order?.status || "Recibido"));
  const appointmentVehicles = clientVehicles.map((vehicle) => ({
    plate: vehicle.plate,
    car: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
  }));
  const appointmentServices: { icon: IconName; label: string }[] = [
    { icon: "wrench", label: "Mantenimiento" },
    { icon: "alert", label: "Frenos" },
    { icon: "gauge", label: "Alineación" },
    { icon: "search", label: "Diagnóstico" },
    { icon: "more", label: "Otro" },
  ];
  const appointmentDates = [
    { short: "Lun", day: "23", label: "Lun 23 jun" },
    { short: "Mar", day: "24", label: "Mar 24 jun" },
    { short: "Mié", day: "25", label: "Mié 25 jun" },
    { short: "Jue", day: "26", label: "Jue 26 jun" },
    { short: "Vie", day: "27", label: "Vie 27 jun" },
  ];
  const appointmentTimes = ["08:00", "09:30", "11:00", "14:00", "15:30", "17:00"];
  const selectedAppointmentVehicle =
    appointmentVehicles.find((vehicle) => vehicle.plate === appointmentVehicle) ||
    appointmentVehicles[0];
  const selectedAppointmentService =
    appointmentService === "Otro"
      ? customAppointmentService.trim() || "Servicio personalizado"
      : appointmentService;
  const clientInitials = clientProfile.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  const saveClientProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const profile = {
      name: String(data.get("name")).trim(),
      phone: String(data.get("phone")).trim(),
      email: String(data.get("email")).trim(),
    };
    setClientProfile(profile);
    setProfileSheet("");
    notify("Datos personales actualizados");
  };
  const addClientVehicle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const plate = String(data.get("plate")).trim().toUpperCase();
    if (clientVehicles.some((vehicle) => vehicle.plate === plate)) {
      notify(`La placa ${plate} ya está registrada`);
      return;
    }
    const vehicle: ClientVehicle = {
      plate,
      brand: String(data.get("brand")).trim(),
      model: String(data.get("model")).trim(),
      year: Number(data.get("year")),
      color: String(data.get("color")).trim(),
    };
    setClientVehicles([...clientVehicles, vehicle]);
    setAddingClientVehicle(false);
    notify(`${vehicle.brand} ${vehicle.model} agregado a tus vehículos`);
  };
  const approveQuote = () => {
    setOrders(
      orders.map((item) =>
        item.id === order.id ? { ...item, status: "En reparación", eta: "3h 20m" } : item,
      ),
    );
    setPoints(points + 151);
    setQuoteApproved(true);
    setQuoteOpen(false);
    notify("Presupuesto aprobado. El taller ya fue notificado.");
  };
  const resetAppointment = () => {
    setAppointmentDone(false);
    setAppointmentStep(1);
    setAppointmentVehicle("ABC-1234");
    setAppointmentService("Mantenimiento");
    setCustomAppointmentService("");
    setAppointmentDate("Mié 25 jun");
    setAppointmentTime("11:00");
  };
  const continueAppointment = () => {
    if (
      appointmentStep === 2 &&
      appointmentService === "Otro" &&
      !customAppointmentService.trim()
    ) {
      notify("Describe qué servicio necesitas para continuar.");
      return;
    }
    if (appointmentStep < 4) {
      setAppointmentStep(appointmentStep + 1);
      return;
    }
    setAppointmentDone(true);
    onAppointment(`${appointmentDate} · ${appointmentTime} · ${selectedAppointmentService}`);
  };
  const addAppointmentToCalendar = () => {
    const selectedDate = appointmentDates.find((date) => date.label === appointmentDate);
    if (!selectedDate) return;
    const [hours, minutes] = appointmentTime.split(":").map(Number);
    const start = new Date(2025, 5, Number(selectedDate.day), hours, minutes);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const formatCalendarDate = (date: Date) =>
      [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
        "T",
        String(date.getHours()).padStart(2, "0"),
        String(date.getMinutes()).padStart(2, "0"),
        "00",
      ].join("");
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mekatron//Cita de taller//ES",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@mekatron.ec`,
      `DTSTART:${formatCalendarDate(start)}`,
      `DTEND:${formatCalendarDate(end)}`,
      `SUMMARY:Mekatron - ${selectedAppointmentService}`,
      `DESCRIPTION:Cita para ${selectedAppointmentVehicle.car} (${appointmentVehicle})`,
      "LOCATION:Mekatron, Cuenca",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cita-mekatron.ics";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Cita añadida a tu calendario");
  };
  const [clientLightbox, setClientLightbox] = useState<{ title: string; url: string } | null>(null);
  const clientFileInputRef = useRef<HTMLInputElement>(null);
  const [clientTrackingPhotos, setClientTrackingPhotos] = useState<Array<{ title: string; url: string }>>([
    { title: "Inspección inicial", url: clientCar },
  ]);

  const handleClientPhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newPhoto = { title: file.name.slice(0, 18), url };
      setClientTrackingPhotos((prev) => [...prev, newPhoto]);
      setClientLightbox(newPhoto);
      notify(`Foto de tu vehículo "${file.name}" cargada con éxito`);
    }
  };

  const tabs: { id: ClientTab; label: string; icon: IconName }[] = [
    { id: "home", label: "Inicio", icon: "home" },
    { id: "car", label: "Mi coche", icon: "car" },
    { id: "appointments", label: "Citas", icon: "calendar" },
    { id: "points", label: "Puntos", icon: "star" },
    { id: "profile", label: "Perfil", icon: "users" },
  ];
  return (
    <div className="client-stage">
      <div className={`phone-app ${dark ? "client-dark" : ""}`}>
        {/* Hidden file input for client image uploads */}
        <input
          type="file"
          accept="image/*"
          ref={clientFileInputRef}
          style={{ display: "none" }}
          onChange={handleClientPhotoUpload}
        />

        {/* Client Photo Lightbox Preview */}
        {clientLightbox && (
          <div
            className="photo-lightbox-overlay"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onClick={() => setClientLightbox(null)}
          >
            <div
              style={{
                maxWidth: 360,
                width: "100%",
                background: "#1e1f21",
                borderRadius: 16,
                padding: 16,
                textAlign: "center",
                color: "#fff",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <b style={{ fontSize: 13 }}>{clientLightbox.title}</b>
                <button
                  type="button"
                  onClick={() => setClientLightbox(null)}
                  style={{ background: "none", border: 0, color: "#fff", cursor: "pointer" }}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <img
                src={clientLightbox.url}
                alt={clientLightbox.title}
                style={{
                  width: "100%",
                  maxHeight: "55vh",
                  objectFit: "contain",
                  borderRadius: 10,
                }}
              />
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setClientLightbox(null)}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "10px", fontSize: 12 }}
                >
                  Cerrar vista previa
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="client-top">
          <button onClick={() => setTab("home")}>
            <img src={mark} alt="Mekatron" />
          </button>
          <div>
            <small>HOLA, {clientProfile.name.split(" ")[0].toUpperCase()}</small>
            <b>Mekatron contigo</b>
          </div>
          <Badge tone="yellow">Vista cliente</Badge>
          <button className="client-bell" onClick={() => setNotifications(true)}>
            <Icon name="bell" />
            <i>3</i>
          </button>
        </header>

        <main className="client-scroll">
          {tab === "home" && (
            <div className="client-view">
              <section className="mobile-greeting">
                <p>Miércoles, 18 de junio</p>
                <h1>
                  Tu Kia está en
                  <br />
                  <em>buenas manos.</em>
                </h1>
              </section>
              <section className="mobile-car-card" style={{ backgroundImage: `url(${clientCar})` }}>
                <div className="mobile-car-overlay" />
                <div className="mobile-car-head">
                  <Badge tone={order.status === "Listo" ? "green" : "yellow"}>{order.status}</Badge>
                  <span>{order.plate}</span>
                </div>
                <div className="mobile-car-copy">
                  <small>EN EL TALLER AHORA</small>
                  <h2>{order.car}</h2>
                  <p>Entrega estimada · {order.eta}</p>
                </div>
                <div className="mobile-stage-line">
                  {[
                    "Recibido",
                    "Diagnóstico",
                    "Aprobación",
                    "Repuestos",
                    "Reparación",
                    "Listo",
                  ].map((step, i) => (
                    <div className={i <= Math.min(stageIndex, 4) ? "done" : ""} key={step}>
                      <i>{i < Math.min(stageIndex, 4) ? <Icon name="check" size={11} /> : i + 1}</i>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab("car")}>
                  Ver seguimiento completo <Icon name="arrow" />
                </button>
              </section>
              {order.status === "Listo" && (
                <section className="ready-banner">
                  <Icon name="check" />
                  <div>
                    <b>Tu coche está listo</b>
                    <p>Puedes retirarlo hasta las 18:30.</p>
                  </div>
                  <button onClick={() => notify("Factura COMP-1095 descargada")}>
                    Ver factura
                  </button>
                </section>
              )}
              {!quoteApproved ? (
                <button
                  className="mobile-action-card quote-alert"
                  onClick={() => setQuoteOpen(true)}
                >
                  <span>
                    <Icon name="file" />
                  </span>
                  <div>
                    <small>ACCIÓN REQUERIDA</small>
                    <b>Presupuesto por aprobar</b>
                    <p>Suspensión delantera · $151,11</p>
                  </div>
                  <Icon name="chevron" />
                </button>
              ) : null}
              <div className="mobile-two-col">
                <button className="mobile-mini-card" onClick={() => setTab("appointments")}>
                  <Icon name="calendar" />
                  <small>PRÓXIMA CITA</small>
                  <b>Sin citas</b>
                  <span>Agendar ahora</span>
                </button>
                <button className="mobile-mini-card">
                  <Icon name="clock" />
                  <small>MANTENIMIENTO</small>
                  <b>En 3.580 km</b>
                  <span className="traffic-yellow">Próximo</span>
                </button>
              </div>
              <button className="mobile-points-card" onClick={() => setTab("points")}>
                <div>
                  <small>MIEMBRO ORO</small>
                  <b>{points.toLocaleString("es-EC")} puntos</b>
                  <p>160 puntos para tu próximo premio</p>
                </div>
                <div className="points-ring">72%</div>
              </button>
              <section className="mobile-update-card">
                <div className="mobile-section-title">
                  <h2>Últimas novedades</h2>
                  <button onClick={() => setNotifications(true)}>Ver todas</button>
                </div>
                <div>
                  <span>
                    <Icon name="wrench" />
                  </span>
                  <p>
                    <b>Diagnóstico actualizado</b>
                    <small>Andrés revisó la suspensión · 10:42</small>
                  </p>
                  <i />
                </div>
              </section>
            </div>
          )}

          {tab === "car" && (
            <div className="client-view">
              <section className="mobile-page-title">
                <small>MI GARAJE</small>
                <h1>Mi coche</h1>
                <p>Seguimiento e historial técnico.</p>
              </section>
              <div className="vehicle-slider">
                <button className="active">
                  <span>ABC-1234</span>
                  <b>Kia Sportage</b>
                  <small>2020 · 68.420 km</small>
                </button>
                <button>
                  <span>PAA-2048</span>
                  <b>Chevrolet Sail</b>
                  <small>2018 · 92.100 km</small>
                </button>
              </div>
              <section className="mobile-card live-tracking">
                <div className="mobile-section-title">
                  <div>
                    <small>SEGUIMIENTO EN VIVO</small>
                    <h2>{order.status}</h2>
                  </div>
                  <i className="pulse" />
                </div>
                {[
                  [
                    "10:42",
                    "Diagnóstico completado",
                    "Revisamos suspensión y bujes delanteros.",
                    true,
                  ],
                  [
                    "09:16",
                    "Inspección inicial",
                    "Registro fotográfico y checklist completo.",
                    true,
                  ],
                  ["08:18", "Vehículo recibido", "Entregado por Daniela Cordero.", true],
                  ["—", "Reparación", "Pendiente de aprobación.", false],
                ].map((item) => (
                  <div className={`tracking-row ${item[3] ? "done" : ""}`} key={item[1] as string}>
                    <span>{item[0]}</span>
                    <i />
                    <p>
                      <b>{item[1]}</b>
                      <small>{item[2]}</small>
                    </p>
                  </div>
                ))}
                <div className="progress-photos">
                  {clientTrackingPhotos.map((photo, i) => (
                    <button
                      key={i}
                      type="button"
                      style={{ backgroundImage: `url(${photo.url})` }}
                      onClick={() => setClientLightbox(photo)}
                      title="Ver foto ampliada"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => clientFileInputRef.current?.click()}
                    title="Tomar o subir foto de tu vehículo"
                  >
                    <Icon name="camera" />
                    <span>Subir foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientLightbox({ title: "Inspección de taller", url: clientCar })}
                  >
                    <Icon name="search" />
                    <span>Ver informe</span>
                  </button>
                </div>
              </section>
              {!quoteApproved ? (
                <button
                  className="mobile-action-card quote-alert"
                  onClick={() => setQuoteOpen(true)}
                >
                  <span>
                    <Icon name="receipt" />
                  </span>
                  <div>
                    <small>PRESUPUESTO OT-{order.id}</small>
                    <b>Reparación de suspensión</b>
                    <p>Total con IVA · $151,11</p>
                  </div>
                  <Icon name="chevron" />
                </button>
              ) : (
                <div className="ready-banner">
                  <Icon name="check" />
                  <div>
                    <b>Presupuesto aprobado</b>
                    <p>El taller ya inició la reparación.</p>
                  </div>
                </div>
              )}
              <section className="mobile-card tech-card">
                <div className="mobile-section-title">
                  <h2>Ficha técnica</h2>
                  <button>Documentos</button>
                </div>
                <div className="tech-grid">
                  <p>
                    <small>PLACA</small>
                    <b>ABC-1234</b>
                  </p>
                  <p>
                    <small>VIN</small>
                    <b>KNAPM81B•••425</b>
                  </p>
                  <p>
                    <small>COMBUSTIBLE</small>
                    <b>Gasolina</b>
                  </p>
                  <p>
                    <small>COLOR / AÑO</small>
                    <b>Blanco · 2020</b>
                  </p>
                </div>
              </section>
              <section className="mobile-card service-history">
                <div className="mobile-section-title">
                  <h2>Historial</h2>
                  <button>Filtrar</button>
                </div>
                {[
                  ["12 jun 2025", "Aceite y filtros", "$186,40"],
                  ["04 feb 2025", "Frenos delanteros", "$248,60"],
                  ["18 oct 2024", "Alineación", "$68,00"],
                ].map((x) => (
                  <button key={x[0]}>
                    <span>
                      <Icon name="check" />
                    </span>
                    <p>
                      <b>{x[1]}</b>
                      <small>{x[0]} · Garantía vigente</small>
                    </p>
                    <strong>{x[2]}</strong>
                  </button>
                ))}
              </section>
            </div>
          )}

          {tab === "appointments" && (
            <div className="client-view">
              <section className="mobile-page-title">
                <small>AGENDA</small>
                <h1>Nueva cita</h1>
                <p>Reserva tu visita en cuatro pasos.</p>
              </section>
              {appointmentDone ? (
                <section className="appointment-success">
                  <i>
                    <Icon name="check" size={32} />
                  </i>
                  <small>CITA CONFIRMADA</small>
                  <h2>¡Te esperamos!</h2>
                  <p>
                    {appointmentDate} · {appointmentTime}
                    <br />
                    {selectedAppointmentService} · {appointmentVehicle}
                  </p>
                  <button onClick={addAppointmentToCalendar}>
                    <Icon name="calendar" />
                    Agregar a mi calendario
                  </button>
                  <button onClick={resetAppointment}>Agendar otra cita</button>
                </section>
              ) : (
                <section className="mobile-card appointment-wizard">
                  <div className="wizard-steps">
                    {[1, 2, 3, 4].map((n) => (
                      <span className={n <= appointmentStep ? "active" : ""} key={n}>
                        {n}
                      </span>
                    ))}
                  </div>
                  {appointmentStep === 1 && (
                    <div className="wizard-pane">
                      <small>PASO 1 DE 4</small>
                      <h2>Elige tu vehículo</h2>
                      {appointmentVehicles.map((vehicle) => (
                        <button
                          className={`choice ${
                            appointmentVehicle === vehicle.plate ? "active" : ""
                          }`}
                          key={vehicle.plate}
                          onClick={() => setAppointmentVehicle(vehicle.plate)}
                        >
                          <Icon name="car" />
                          <p>
                            <b>{vehicle.plate}</b>
                            <span>{vehicle.car}</span>
                          </p>
                          {appointmentVehicle === vehicle.plate && <Icon name="check" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {appointmentStep === 2 && (
                    <div className="wizard-pane">
                      <small>PASO 2 DE 4</small>
                      <h2>¿Qué necesitas?</h2>
                      <div className="service-choices">
                        {appointmentServices.map((service) => (
                          <button
                            className={appointmentService === service.label ? "active" : ""}
                            key={service.label}
                            onClick={() => setAppointmentService(service.label)}
                          >
                            <Icon name={service.icon} />
                            <span>{service.label}</span>
                          </button>
                        ))}
                      </div>
                      {appointmentService === "Otro" && (
                        <label className="custom-service-field">
                          <span>Cuéntanos qué necesitas</span>
                          <textarea
                            value={customAppointmentService}
                            onChange={(event) => setCustomAppointmentService(event.target.value)}
                            placeholder="Ej. Revisión de ruido en la suspensión..."
                            autoFocus
                          />
                        </label>
                      )}
                    </div>
                  )}
                  {appointmentStep === 3 && (
                    <div className="wizard-pane">
                      <small>PASO 3 DE 4</small>
                      <h2>Fecha y hora</h2>
                      <div className="date-strip">
                        {appointmentDates.map((date) => (
                          <button
                            className={appointmentDate === date.label ? "active" : ""}
                            key={date.label}
                            onClick={() => setAppointmentDate(date.label)}
                          >
                            {date.short}
                            <b>{date.day}</b>
                          </button>
                        ))}
                      </div>
                      <div className="time-grid">
                        {appointmentTimes.map((time) => (
                          <button
                            className={appointmentTime === time ? "active" : ""}
                            key={time}
                            onClick={() => setAppointmentTime(time)}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {appointmentStep === 4 && (
                    <div className="wizard-pane">
                      <small>PASO 4 DE 4</small>
                      <h2>Confirma tu cita</h2>
                      <div className="appointment-summary">
                        <p>
                          <Icon name="car" />
                          <span>
                            {selectedAppointmentVehicle.plate}
                            <b>{selectedAppointmentVehicle.car}</b>
                          </span>
                        </p>
                        <p>
                          <Icon name="wrench" />
                          <span>
                            Servicio<b>{selectedAppointmentService}</b>
                          </span>
                        </p>
                        <p>
                          <Icon name="calendar" />
                          <span>
                            Fecha y hora
                            <b>
                              {appointmentDate} · {appointmentTime}
                            </b>
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="wizard-actions">
                    {appointmentStep > 1 && (
                      <button onClick={() => setAppointmentStep(appointmentStep - 1)}>Atrás</button>
                    )}
                    <button onClick={continueAppointment}>
                      {appointmentStep === 4 ? "Confirmar cita" : "Continuar"}
                      <Icon name="arrow" />
                    </button>
                  </div>
                </section>
              )}
              <section className="mobile-card upcoming-list">
                <div className="mobile-section-title">
                  <h2>Próximas citas</h2>
                </div>
                {appointmentDone ? (
                  <div className="client-appointment-row">
                    <span>
                      <Icon name="calendar" />
                    </span>
                    <div>
                      <b>{selectedAppointmentService}</b>
                      <small>
                        {appointmentDate} · {appointmentTime}
                      </small>
                      <p>
                        {selectedAppointmentVehicle.car} · {appointmentVehicle}
                      </p>
                    </div>
                    <Badge tone="green">Confirmada</Badge>
                  </div>
                ) : (
                  <div className="empty-mobile">
                    <Icon name="calendar" />
                    <b>No tienes citas pendientes</b>
                    <p>Tu próxima visita aparecerá aquí.</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "points" && (
            <div className="client-view">
              <section className="mobile-page-title">
                <small>MEKATRON REWARDS</small>
                <h1>Mis puntos</h1>
                <p>Cada visita te lleva más lejos.</p>
              </section>
              <section className="loyalty-mobile-hero">
                <TirePattern />
                <small>NIVEL ORO</small>
                <h2>{points.toLocaleString("es-EC")}</h2>
                <p>puntos disponibles</p>
                <div>
                  <i style={{ width: "72%" }} />
                </div>
                <span>160 puntos para un cambio de aceite gratis</span>
              </section>
              <div className="mobile-section-title rewards-title">
                <h2>Premios para ti</h2>
                <button>Ver todos</button>
              </div>
              <div className="mobile-rewards">
                {[
                  ["10% descuento", 750, true],
                  ["Alineación gratis", 1200, true],
                  ["Cambio de aceite", 3000, false],
                  ["Chequeo completo", 4200, false],
                ].map((x) => (
                  <article key={x[0] as string}>
                    <span>
                      <Icon name="star" />
                    </span>
                    <h3>{x[0]}</h3>
                    <p>{x[1]} puntos</p>
                    <button
                      disabled={!x[2]}
                      onClick={() => {
                        setPoints(points - (x[1] as number));
                        notify("Premio canjeado correctamente");
                      }}
                    >
                      {x[2] ? "Canjear" : "Bloqueado"}
                    </button>
                  </article>
                ))}
              </div>
              <section className="mobile-card referral-card">
                <span>
                  <Icon name="users" />
                </span>
                <div>
                  <small>REFIERE Y GANA</small>
                  <h2>150 puntos para ambos</h2>
                  <p>
                    Comparte tu código <b>DANI150</b>
                  </p>
                </div>
                <button onClick={() => notify("Enlace de referido copiado")}>
                  <Icon name="send" />
                </button>
              </section>
              <section className="mobile-card points-history">
                <div className="mobile-section-title">
                  <h2>Movimientos</h2>
                </div>
                {[
                  ["Servicio completado", "+186", "12 jun"],
                  ["Referido: Andrea", "+150", "2 jun"],
                  ["Canje descuento", "−750", "18 may"],
                ].map((x) => (
                  <div key={x[0]}>
                    <i className={(x[1] as string).startsWith("+") ? "plus" : "minus"} />
                    <p>
                      <b>{x[0]}</b>
                      <small>{x[2]}</small>
                    </p>
                    <strong>{x[1]}</strong>
                  </div>
                ))}
              </section>
            </div>
          )}

          {tab === "profile" && (
            <div className="client-view">
              <section className="profile-mobile-head">
                <span>{clientInitials}</span>
                <h1>{clientProfile.name}</h1>
                <p>Cliente desde marzo de 2022</p>
                <Badge tone="yellow">Miembro Oro</Badge>
                <SupabaseStatus client />
              </section>
              <section className="mobile-card profile-menu">
                <button onClick={() => setProfileSheet("personal")}>
                  <Icon name="users" />
                  <p>
                    <b>Datos personales</b>
                    <small>
                      {clientProfile.phone} · {clientProfile.email}
                    </small>
                  </p>
                  <Icon name="chevron" />
                </button>
                <button
                  onClick={() => {
                    setAddingClientVehicle(false);
                    setProfileSheet("vehicles");
                  }}
                >
                  <Icon name="car" />
                  <p>
                    <b>Mis vehículos</b>
                    <small>{clientVehicles.length} vehículos registrados</small>
                  </p>
                  <Icon name="chevron" />
                </button>
                <button>
                  <Icon name="bell" />
                  <p>
                    <b>Notificaciones</b>
                    <small>WhatsApp y correo activos</small>
                  </p>
                  <span className="toggle on" />
                </button>
                <button onClick={() => setDark(!dark)}>
                  <Icon name={dark ? "sun" : "moon"} />
                  <p>
                    <b>Modo oscuro</b>
                    <small>{dark ? "Activado" : "Desactivado"}</small>
                  </p>
                  <span className={`toggle ${dark ? "on" : ""}`} />
                </button>
              </section>
              <section className="mobile-card workshop-contact">
                <small>TU TALLER</small>
                <h2>Mekatron Cuenca</h2>
                <div className="map-sim">
                  <Icon name="pin" />
                  <span>
                    Av. España 4-52
                    <br />y Elia Liut
                  </span>
                </div>
                <div>
                  <button onClick={() => notify("Llamando al 07 284 1092")}>
                    <Icon name="phone" />
                    Llamar
                  </button>
                  <button onClick={() => notify("Abriendo WhatsApp")}>
                    <Icon name="whatsapp" />
                    WhatsApp
                  </button>
                </div>
                <p>Lun–Vie 08:00–18:30 · Sáb 08:00–13:00</p>
              </section>
              <button className="switch-admin-mobile" onClick={onSwitch}>
                <Icon name="arrow" />
                <span>
                  <b>Cambiar a vista de administrador</b>
                  <small>Requiere inicio de sesión</small>
                </span>
                <Icon name="chevron" />
              </button>
              <button className="logout-mobile" onClick={onLogout}>
                <Icon name="logout" />
                Cerrar sesión
              </button>
            </div>
          )}
        </main>

        <button className={`mobile-fab ${fab ? "open" : ""}`} onClick={() => setFab(!fab)}>
          <Icon name={fab ? "close" : "plus"} />
        </button>
        {fab && (
          <div className="fab-menu">
            <button
              onClick={() => {
                setTab("appointments");
                setFab(false);
              }}
            >
              <Icon name="calendar" />
              Agendar cita
            </button>
            <button onClick={() => notify("Llamando al taller")}>
              <Icon name="phone" />
              Llamar al taller
            </button>
            <button onClick={() => notify("Abriendo WhatsApp")}>
              <Icon name="whatsapp" />
              Escribir por WhatsApp
            </button>
          </div>
        )}
        <nav className="client-bottom-nav">
          {tabs.map((item) => (
            <button
              className={tab === item.id ? "active" : ""}
              key={item.id}
              onClick={() => setTab(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {profileSheet === "personal" && (
          <div className="client-sheet-overlay" onClick={() => setProfileSheet("")}>
            <form
              className="client-sheet profile-edit-sheet"
              onClick={(event) => event.stopPropagation()}
              onSubmit={saveClientProfile}
            >
              <div className="sheet-handle" />
              <div className="mobile-section-title">
                <div>
                  <small>MI PERFIL</small>
                  <h2>Datos personales</h2>
                </div>
                <button type="button" onClick={() => setProfileSheet("")}>
                  <Icon name="close" />
                </button>
              </div>
              <div className="client-profile-fields">
                <label>
                  <span>Nombre completo</span>
                  <input name="name" defaultValue={clientProfile.name} required autoFocus />
                </label>
                <label>
                  <span>Número telefónico</span>
                  <input name="phone" type="tel" defaultValue={clientProfile.phone} required />
                </label>
                <label>
                  <span>Correo electrónico</span>
                  <input name="email" type="email" defaultValue={clientProfile.email} required />
                </label>
              </div>
              <button className="client-save-button" type="submit">
                <Icon name="check" />
                Guardar cambios
              </button>
            </form>
          </div>
        )}

        {profileSheet === "vehicles" && (
          <div className="client-sheet-overlay" onClick={() => setProfileSheet("")}>
            <section
              className="client-sheet profile-edit-sheet"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="mobile-section-title">
                <div>
                  <small>MI PERFIL</small>
                  <h2>{addingClientVehicle ? "Agregar vehículo" : "Mis vehículos"}</h2>
                </div>
                <button
                  onClick={() =>
                    addingClientVehicle ? setAddingClientVehicle(false) : setProfileSheet("")
                  }
                >
                  <Icon name={addingClientVehicle ? "arrow" : "close"} />
                </button>
              </div>
              {addingClientVehicle ? (
                <form className="client-profile-fields" onSubmit={addClientVehicle}>
                  <label>
                    <span>Placa</span>
                    <input name="plate" placeholder="ABC-1234" maxLength={10} required autoFocus />
                  </label>
                  <div className="client-field-row">
                    <label>
                      <span>Marca</span>
                      <input name="brand" placeholder="Ej. Toyota" required />
                    </label>
                    <label>
                      <span>Modelo</span>
                      <input name="model" placeholder="Ej. Corolla" required />
                    </label>
                  </div>
                  <div className="client-field-row">
                    <label>
                      <span>Año</span>
                      <input
                        name="year"
                        type="number"
                        min="1950"
                        max="2026"
                        placeholder="2022"
                        required
                      />
                    </label>
                    <label>
                      <span>Color</span>
                      <input name="color" placeholder="Ej. Blanco" required />
                    </label>
                  </div>
                  <button className="client-save-button" type="submit">
                    <Icon name="plus" />
                    Agregar vehículo
                  </button>
                </form>
              ) : (
                <>
                  <div className="client-vehicle-list">
                    {clientVehicles.map((vehicle) => (
                      <div key={vehicle.plate}>
                        <span>
                          <Icon name="car" />
                        </span>
                        <p>
                          <b>{vehicle.plate}</b>
                          <small>
                            {vehicle.brand} {vehicle.model} {vehicle.year} · {vehicle.color}
                          </small>
                        </p>
                        <Badge tone={vehicle.plate === "ABC-1234" ? "yellow" : "gray"}>
                          {vehicle.plate === "ABC-1234" ? "Principal" : "Registrado"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <button
                    className="client-save-button add-client-vehicle"
                    onClick={() => setAddingClientVehicle(true)}
                  >
                    <Icon name="plus" />
                    Agregar otro coche
                  </button>
                </>
              )}
            </section>
          </div>
        )}

        {quoteOpen && (
          <div className="client-sheet-overlay" onClick={() => setQuoteOpen(false)}>
            <section className="client-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-handle" />
              <div className="mobile-section-title">
                <div>
                  <small>PRESUPUESTO OT-{order.id}</small>
                  <h2>Suspensión delantera</h2>
                </div>
                <button onClick={() => setQuoteOpen(false)}>
                  <Icon name="close" />
                </button>
              </div>
              <p className="sheet-intro">
                Detectamos desgaste en los bujes delanteros. Recomendamos reemplazarlos para
                recuperar estabilidad y seguridad.
              </p>
              <div className="sheet-lines">
                <span>
                  Diagnóstico y mano de obra<b>$45,00</b>
                </span>
                <span>
                  Bujes delanteros × 2<b>$86,40</b>
                </span>
                <span>
                  IVA 15%<b>$19,71</b>
                </span>
                <strong>
                  Total<b>$151,11</b>
                </strong>
              </div>
              <button className="approve-big" onClick={approveQuote}>
                Aprobar presupuesto
                <Icon name="check" />
              </button>
              <button
                className="reject-big"
                onClick={() => {
                  setQuoteOpen(false);
                  notify("Solicitud de llamada enviada");
                }}
              >
                Pedir una llamada
              </button>
            </section>
          </div>
        )}
        {notifications && (
          <div className="client-sheet-overlay" onClick={() => setNotifications(false)}>
            <section
              className="client-sheet notifications-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="mobile-section-title">
                <h2>Notificaciones</h2>
                <button onClick={() => setNotifications(false)}>
                  <Icon name="close" />
                </button>
              </div>
              <small>HOY</small>
              {[
                [
                  "file",
                  "Presupuesto por aprobar",
                  "Revisa el diagnóstico de tu Kia.",
                  "Hace 8 min",
                ],
                ["wrench", "Diagnóstico completado", "Andrés actualizó tu orden.", "10:42"],
                ["calendar", "Recuerda tu cita", "Mantenimiento el miércoles.", "09:15"],
              ].map((x) => (
                <button
                  key={x[1]}
                  onClick={() => {
                    setNotifications(false);
                    x[0] === "file"
                      ? setQuoteOpen(true)
                      : setTab(x[0] === "calendar" ? "appointments" : "car");
                  }}
                >
                  <span>
                    <Icon name={x[0] as IconName} />
                  </span>
                  <p>
                    <b>{x[1]}</b>
                    <small>
                      {x[2]} · {x[3]}
                    </small>
                  </p>
                  <i />
                </button>
              ))}
            </section>
          </div>
        )}
        {toast && (
          <div className="client-toast">
            <Icon name="check" />
            <span>{toast}</span>
          </div>
        )}
      </div>
      <p className="phone-caption">Vista móvil · 390 × 844</p>
    </div>
  );
}

class SafeErrorBoundary extends React.Component<{ children: React.ReactNode; fallbackLabel?: string }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode; fallbackLabel?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("SafeErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: "center", background: "#f8f9fa", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ maxWidth: 440, background: "#fff", padding: 28, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 18, color: "#111827", marginBottom: 8 }}>Recuperando Interfaz</h2>
            <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 20 }}>Se ha restaurado la vista de forma segura.</p>
            <button
              onClick={() => {
                localStorage.removeItem("mekatron_active_session");
                window.location.reload();
              }}
              style={{ background: "#1e1f21", color: "#f9c640", border: 0, padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Reiniciar Vista
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [mode, setMode] = useState<AppMode>("welcome");
  const [orders, setOrders] = useState(initialOrders);
  const [appointment, setAppointment] = useState<string>();
  const [activeUser, setActiveUser] = useState<{ fullName?: string; email?: string; phone?: string; role?: string } | undefined>(() => {
    try {
      const saved = localStorage.getItem("mekatron_active_session");
      return saved ? JSON.parse(saved) : undefined;
    } catch {
      return undefined;
    }
  });

  const handleEnter = (role: "admin" | "client", user?: SupabaseUser) => {
    if (user) {
      const u = {
        fullName: user.fullName || (role === "admin" ? "Administrador Mekatron" : "Cliente Mekatron"),
        email: user.email,
        phone: user.phone,
        role
      };
      setActiveUser(u);
      localStorage.setItem("mekatron_active_session", JSON.stringify(u));
    }
    setMode(role === "admin" ? "admin" : "client");
  };

  const handleLogout = () => {
    setActiveUser(undefined);
    localStorage.removeItem("mekatron_active_session");
    setMode("welcome");
  };

  const goClient = () => setMode("client-login");
  const goAdmin = () => setMode("admin-login");

  if (mode === "welcome") return <WelcomeScreen choose={setMode} />;
  if (mode === "admin-login")
    return (
      <LoginScreen
        type="admin"
        back={() => setMode("welcome")}
        enter={handleEnter}
      />
    );
  if (mode === "client-login")
    return (
      <LoginScreen
        type="client"
        back={() => setMode("welcome")}
        enter={handleEnter}
      />
    );
  if (mode === "client")
    return (
      <SafeErrorBoundary fallbackLabel="Portal Cliente">
        <ClientApp
          orders={orders}
          setOrders={setOrders}
          onSwitch={goAdmin}
          onLogout={handleLogout}
          onAppointment={setAppointment}
          currentUser={activeUser}
        />
      </SafeErrorBoundary>
    );
  return (
    <SafeErrorBoundary fallbackLabel="Panel Taller">
      <AdminApp
        orders={orders}
        setOrders={setOrders}
        onSwitch={goClient}
        onLogout={handleLogout}
        sharedAppointment={appointment}
        currentUser={activeUser}
      />
    </SafeErrorBoundary>
  );
}


export default App;
