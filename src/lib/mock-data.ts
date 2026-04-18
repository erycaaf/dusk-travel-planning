import type {
  ActivityFeedItem,
  ActivityIdea,
  Expense,
  Flight,
  PackingItem,
  ScheduledActivity,
  Stay,
  Trip,
  User,
} from "./types";
import mendozaCover from "@/assets/mendoza-vineyard.jpg";
import buenosAiresCover from "@/assets/cover-buenos-aires.jpg";
import lisbonCover from "@/assets/cover-lisbon.jpg";
import kyotoCover from "@/assets/cover-kyoto.jpg";

export const coverGallery = [
  { id: "mendoza", url: mendozaCover, label: "Vinhedos ao pôr do sol" },
  { id: "buenosaires", url: buenosAiresCover, label: "Rua portenha" },
  { id: "lisbon", url: lisbonCover, label: "Telhados de Lisboa" },
  { id: "kyoto", url: kyotoCover, label: "Floresta de bambu" },
];

export const users: User[] = [
  {
    id: "u-eryca",
    name: "Eryca Mendes",
    email: "eryca@dusk.app",
    avatarUrl: "https://i.pravatar.cc/200?img=47",
    bio: "Coleciono cafés, vinhos e pôres do sol.",
    interests: ["Café", "Gastronomia", "Vinho", "Fotografia", "Cultura local"],
    pace: "balanced",
  },
  {
    id: "u-leandro",
    name: "Leandro Souza",
    email: "leandro@dusk.app",
    avatarUrl: "https://i.pravatar.cc/200?img=12",
    bio: "Trilhas, mapas e mercados locais.",
    interests: ["Caminhadas", "Atividades ao ar livre", "Música ao vivo"],
    pace: "intense",
  },
];

export const currentUser: User = users[0];

export const trips: Trip[] = [
  {
    id: "t-mendoza",
    name: "Mendoza 2026",
    country: "Argentina",
    city: "Mendoza",
    originCity: "São Paulo",
    startDate: "2026-05-12",
    endDate: "2026-05-22",
    coverUrl: mendozaCover,
    status: "planning",
    styles: ["gastronomica", "natureza", "cultural"],
    members: [
      { userId: "u-eryca", role: "owner" },
      { userId: "u-leandro", role: "editor" },
    ],
    budget: 12000,
  },
];

export const flights: Flight[] = [
  {
    id: "f-1",
    tripId: "t-mendoza",
    airline: "LATAM",
    flightNumber: "LA8074",
    fromCode: "GRU",
    toCode: "MDZ",
    fromCity: "São Paulo",
    toCity: "Mendoza",
    departure: "2026-05-12T07:40:00",
    arrival: "2026-05-12T10:20:00",
    bookingCode: "XR7K2P",
    terminal: "3",
    gate: "B12",
  },
  {
    id: "f-2",
    tripId: "t-mendoza",
    airline: "LATAM",
    flightNumber: "LA8075",
    fromCode: "MDZ",
    toCode: "GRU",
    fromCity: "Mendoza",
    toCity: "São Paulo",
    departure: "2026-05-22T19:10:00",
    arrival: "2026-05-22T23:55:00",
    bookingCode: "XR7K2P",
    terminal: "1",
  },
];

export const stays: Stay[] = [
  {
    id: "s-1",
    tripId: "t-mendoza",
    type: "airbnb",
    name: "Casa de Adobe — Chacras de Coria",
    address: "Calle Italia 5320, Chacras de Coria, Mendoza",
    checkIn: "2026-05-12T15:00:00",
    checkOut: "2026-05-22T11:00:00",
    bookingCode: "HMABNB-998211",
    contact: "+54 9 261 555-0143",
  },
];

export const ideas: ActivityIdea[] = [
  { id: "a-1", tripId: "t-mendoza", title: "Vinícola Alyan", category: "vinho", durationMin: 180, transitMin: 120, estimatedCost: 320, location: "Maipú, Mendoza", priority: "high" },
  { id: "a-2", tripId: "t-mendoza", title: "Bodega Catena Zapata", category: "vinho", durationMin: 150, transitMin: 90, estimatedCost: 480, location: "Agrelo", priority: "high" },
  { id: "a-3", tripId: "t-mendoza", title: "Parque General San Martín", category: "natureza", durationMin: 120, transitMin: 30, estimatedCost: 0, location: "Mendoza Centro", priority: "med" },
  { id: "a-4", tripId: "t-mendoza", title: "Cerro de la Gloria", category: "natureza", durationMin: 90, transitMin: 30, estimatedCost: 0, location: "Mendoza", priority: "med" },
  { id: "a-5", tripId: "t-mendoza", title: "Mercado Central", category: "gastronomia", durationMin: 90, transitMin: 20, estimatedCost: 120, location: "Mendoza Centro", priority: "med" },
  { id: "a-6", tripId: "t-mendoza", title: "Restaurant Azafrán", category: "gastronomia", durationMin: 150, transitMin: 30, estimatedCost: 380, location: "Av. Sarmiento", priority: "high" },
  { id: "a-7", tripId: "t-mendoza", title: "Cacheuta Termas", category: "natureza", durationMin: 240, transitMin: 120, estimatedCost: 220, location: "Cacheuta", priority: "low" },
  { id: "a-8", tripId: "t-mendoza", title: "Caminito Bodega Lagarde", category: "vinho", durationMin: 120, transitMin: 60, estimatedCost: 260, location: "Luján de Cuyo", priority: "med" },
  { id: "a-9", tripId: "t-mendoza", title: "Plaza Independencia (passeio)", category: "cultura", durationMin: 60, transitMin: 15, estimatedCost: 0, location: "Mendoza Centro", priority: "low" },
  { id: "a-10", tripId: "t-mendoza", title: "Compras Av. Las Heras", category: "compras", durationMin: 90, transitMin: 20, estimatedCost: 200, location: "Av. Las Heras", priority: "low" },
];

// A couple of pre-scheduled activities to make the planner feel alive.
export const scheduled: ScheduledActivity[] = [
  { ...ideas[0], date: "2026-05-13", startMin: 14 * 60 },
  { ...ideas[5], date: "2026-05-13", startMin: 20 * 60 },
  { ...ideas[2], date: "2026-05-14", startMin: 9 * 60 },
];

export const expenses: Expense[] = [
  { id: "e-1", tripId: "t-mendoza", title: "Passagens LATAM ida e volta", category: "passagens", amount: 4280, currency: "BRL", amountBRL: 4280, date: "2026-02-10", paidBy: "u-eryca", splitWith: ["u-eryca", "u-leandro"] },
  { id: "e-2", tripId: "t-mendoza", title: "Reserva Airbnb", category: "estadias", amount: 3120, currency: "BRL", amountBRL: 3120, date: "2026-02-12", paidBy: "u-leandro", splitWith: ["u-eryca", "u-leandro"] },
  { id: "e-3", tripId: "t-mendoza", title: "Almoço Azafrán", category: "alimentacao", amount: 28500, currency: "ARS", amountBRL: 175, date: "2026-05-13", paidBy: "u-eryca", splitWith: ["u-eryca", "u-leandro"] },
  { id: "e-4", tripId: "t-mendoza", title: "Vinícola Alyan — degustação", category: "passeios", amount: 64000, currency: "ARS", amountBRL: 392, date: "2026-05-13", paidBy: "u-eryca", splitWith: ["u-eryca", "u-leandro"] },
  { id: "e-5", tripId: "t-mendoza", title: "Mochila viagem", category: "bagagem", amount: 320, currency: "BRL", amountBRL: 320, date: "2026-03-02", paidBy: "u-leandro", splitWith: ["u-leandro"] },
  { id: "e-6", tripId: "t-mendoza", title: "Chip de celular", category: "telefonia", amount: 90, currency: "BRL", amountBRL: 90, date: "2026-05-12", paidBy: "u-eryca", splitWith: ["u-eryca"] },
  { id: "e-7", tripId: "t-mendoza", title: "Uber aeroporto", category: "transporte", amount: 12000, currency: "ARS", amountBRL: 74, date: "2026-05-12", paidBy: "u-leandro", splitWith: ["u-eryca", "u-leandro"] },
  { id: "e-8", tripId: "t-mendoza", title: "Vinhos para levar", category: "lembrancinhas", amount: 95000, currency: "ARS", amountBRL: 580, date: "2026-05-21", paidBy: "u-eryca", splitWith: ["u-eryca"] },
  { id: "e-9", tripId: "t-mendoza", title: "Catena Zapata — visita", category: "passeios", amount: 78000, currency: "ARS", amountBRL: 478, date: "2026-05-15", paidBy: "u-eryca", splitWith: ["u-eryca", "u-leandro"] },
  { id: "e-10", tripId: "t-mendoza", title: "Mercado Central — petiscos", category: "alimentacao", amount: 18000, currency: "ARS", amountBRL: 110, date: "2026-05-14", paidBy: "u-leandro", splitWith: ["u-eryca", "u-leandro"] },
  { id: "e-11", tripId: "t-mendoza", title: "Roupas frio", category: "roupas", amount: 540, currency: "BRL", amountBRL: 540, date: "2026-04-18", paidBy: "u-eryca", splitWith: ["u-eryca"] },
  { id: "e-12", tripId: "t-mendoza", title: "Ibuprofeno + farmacinha", category: "medicamentos", amount: 78, currency: "BRL", amountBRL: 78, date: "2026-05-08", paidBy: "u-eryca", splitWith: ["u-eryca", "u-leandro"] },
  { id: "e-13", tripId: "t-mendoza", title: "Termas Cacheuta", category: "passeios", amount: 42000, currency: "ARS", amountBRL: 258, date: "2026-05-16", paidBy: "u-eryca", splitWith: ["u-eryca", "u-leandro"] },
  { id: "e-14", tripId: "t-mendoza", title: "Café Bonafide", category: "alimentacao", amount: 9500, currency: "ARS", amountBRL: 58, date: "2026-05-17", paidBy: "u-leandro", splitWith: ["u-eryca", "u-leandro"] },
  { id: "e-15", tripId: "t-mendoza", title: "Passaporte renovação", category: "documentos", amount: 257, currency: "BRL", amountBRL: 257, date: "2026-01-22", paidBy: "u-eryca", splitWith: ["u-eryca"] },
];

export const packing: PackingItem[] = [
  { id: "p-1", tripId: "t-mendoza", section: "documentos", name: "Passaporte", qty: 1, assignedTo: "u-eryca", packed: true },
  { id: "p-2", tripId: "t-mendoza", section: "documentos", name: "RG / CNH", qty: 1, assignedTo: "u-eryca", packed: true },
  { id: "p-3", tripId: "t-mendoza", section: "documentos", name: "Cartão internacional", qty: 2, assignedTo: "u-eryca", packed: true },
  { id: "p-4", tripId: "t-mendoza", section: "documentos", name: "Seguro viagem", qty: 1, assignedTo: "u-leandro", packed: false },
  { id: "p-5", tripId: "t-mendoza", section: "mao", name: "Carregador celular", qty: 2, assignedTo: "u-eryca", packed: true },
  { id: "p-6", tripId: "t-mendoza", section: "mao", name: "Fone de ouvido", qty: 1, assignedTo: "u-leandro", packed: true },
  { id: "p-7", tripId: "t-mendoza", section: "mao", name: "Garrafinha vazia", qty: 2, assignedTo: "u-eryca", packed: false },
  { id: "p-8", tripId: "t-mendoza", section: "mao", name: "Snacks viagem", qty: 4, assignedTo: "u-leandro", packed: false },
  { id: "p-9", tripId: "t-mendoza", section: "despachada", name: "Casaco pesado", qty: 2, assignedTo: "u-eryca", packed: true },
  { id: "p-10", tripId: "t-mendoza", section: "despachada", name: "Calça jeans", qty: 3, assignedTo: "u-eryca", packed: true },
  { id: "p-11", tripId: "t-mendoza", section: "despachada", name: "Tênis caminhada", qty: 1, assignedTo: "u-leandro", packed: true },
  { id: "p-12", tripId: "t-mendoza", section: "despachada", name: "Cachecol", qty: 2, assignedTo: "u-eryca", packed: false },
  { id: "p-13", tripId: "t-mendoza", section: "roupas", name: "Camisetas térmicas", qty: 4, assignedTo: "u-eryca", packed: true },
  { id: "p-14", tripId: "t-mendoza", section: "roupas", name: "Meias térmicas", qty: 6, assignedTo: "u-eryca", packed: true },
  { id: "p-15", tripId: "t-mendoza", section: "roupas", name: "Pijama quente", qty: 2, assignedTo: "u-leandro", packed: true },
  { id: "p-16", tripId: "t-mendoza", section: "roupas", name: "Roupa elegante (jantar)", qty: 1, assignedTo: "u-eryca", packed: false },
  { id: "p-17", tripId: "t-mendoza", section: "higiene", name: "Escova + pasta dente", qty: 2, assignedTo: "u-eryca", packed: true },
  { id: "p-18", tripId: "t-mendoza", section: "higiene", name: "Hidratante facial", qty: 1, assignedTo: "u-eryca", packed: true },
  { id: "p-19", tripId: "t-mendoza", section: "higiene", name: "Protetor labial", qty: 2, assignedTo: "u-eryca", packed: false },
  { id: "p-20", tripId: "t-mendoza", section: "higiene", name: "Shampoo viagem", qty: 1, assignedTo: "u-leandro", packed: true },
  { id: "p-21", tripId: "t-mendoza", section: "medicamentos", name: "Ibuprofeno", qty: 1, assignedTo: "u-eryca", packed: true },
  { id: "p-22", tripId: "t-mendoza", section: "medicamentos", name: "Antialérgico", qty: 1, assignedTo: "u-eryca", packed: true },
  { id: "p-23", tripId: "t-mendoza", section: "medicamentos", name: "Dramin", qty: 1, assignedTo: "u-leandro", packed: false },
  { id: "p-24", tripId: "t-mendoza", section: "eletronicos", name: "Câmera fotográfica", qty: 1, assignedTo: "u-eryca", packed: true },
  { id: "p-25", tripId: "t-mendoza", section: "eletronicos", name: "Adaptador de tomada", qty: 2, assignedTo: "u-eryca", packed: true },
  { id: "p-26", tripId: "t-mendoza", section: "eletronicos", name: "Power bank", qty: 1, assignedTo: "u-leandro", packed: false },
  { id: "p-27", tripId: "t-mendoza", section: "pessoais", name: "Óculos de sol", qty: 2, assignedTo: "u-eryca", packed: true },
  { id: "p-28", tripId: "t-mendoza", section: "pessoais", name: "Chapéu", qty: 1, assignedTo: "u-leandro", packed: false },
  { id: "p-29", tripId: "t-mendoza", section: "comprar", name: "Garrafa de vinho de presente", qty: 3, assignedTo: "u-eryca", packed: false },
  { id: "p-30", tripId: "t-mendoza", section: "comprar", name: "Alfajores", qty: 12, assignedTo: "u-leandro", packed: false },
];

export const feed: ActivityFeedItem[] = [
  { id: "fe-1", tripId: "t-mendoza", userId: "u-leandro", text: "adicionou Vinícola Alyan ao roteiro", at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: "fe-2", tripId: "t-mendoza", userId: "u-eryca", text: "registrou R$ 240 em alimentação", at: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
  { id: "fe-3", tripId: "t-mendoza", userId: "u-eryca", text: "marcou 3 itens como embalados", at: new Date(Date.now() - 28 * 3600 * 1000).toISOString() },
  { id: "fe-4", tripId: "t-mendoza", userId: "u-leandro", text: "salvou Bodega Catena Zapata", at: new Date(Date.now() - 50 * 3600 * 1000).toISOString() },
  { id: "fe-5", tripId: "t-mendoza", userId: "u-eryca", text: "criou a viagem Mendoza 2026", at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString() },
];
