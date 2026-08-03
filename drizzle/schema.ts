import { mysqlTable, int, varchar, text, timestamp, date } from "drizzle-orm/mysql-core";
import { eq } from "drizzle-orm";

// Users are now managed in Supabase auth (auth.users) with metadata stored in user_metadata
// No local users table needed - using Supabase as single source of truth

export type User = {
  id: number;
  openId: string;
  name: string;
  email: string;
  loginMethod: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = Partial<User>;

// Audit logs table
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: int("timestamp").notNull(),
  dataFormatada: varchar("data_formatada", { length: 50 }),
  usuario: varchar("usuario", { length: 320 }).notNull(),
  usuarioNome: varchar("usuario_nome", { length: 255 }),
  acao: varchar("acao", { length: 100 }).notNull(),
  descricao: text("descricao"),
  tipoDocumento: varchar("tipo_documento", { length: 50 }),
  idDocumento: varchar("id_documento", { length: 100 }),
  dadosAntes: text("dados_antes"),
  dadosDepois: text("dados_depois"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Técnicos table - All fields prefixed with 'tec'
export const tecnicos = mysqlTable("tecnicos", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  tecNome: varchar("tec_nome", { length: 255 }).notNull(),
  tecTelefone: varchar("tec_telefone", { length: 20 }),
  tecCPF: varchar("tec_cpf", { length: 14 }).unique(),
  tecRG: varchar("tec_rg", { length: 20 }),
  tecCEP: varchar("tec_cep", { length: 10 }),
  tecRua: varchar("tec_rua", { length: 255 }),
  tecNumero: varchar("tec_numero", { length: 10 }),
  tecComplemento: varchar("tec_complemento", { length: 255 }),
  tecBairro: varchar("tec_bairro", { length: 255 }),
  tecCidade: varchar("tec_cidade", { length: 255 }),
  tecUF: varchar("tec_uf", { length: 2 }),
  tecEmpresaParceira: varchar("tec_empresa_parceira", { length: 255 }),
  // Individual evaluation fields (0-5 scale)
  tecAvaliacaoPontualidade: varchar("tec_avaliacao_pontualidade", { length: 10 }).default("0.00"),
  tecAvaliacaoFerramentas: varchar("tec_avaliacao_ferramentas", { length: 10 }).default("0.00"),
  tecAvaliacaoProdutividade: varchar("tec_avaliacao_produtividade", { length: 10 }).default("0.00"),
  tecAvaliacaoConhecimento: varchar("tec_avaliacao_conhecimento", { length: 10 }).default("0.00"),
  tecAvaliacaoFlexibilidade: varchar("tec_avaliacao_flexibilidade", { length: 10 }).default("0.00"),
  // Overall evaluation (calculated as average of the 5 fields)
  tecAvaliacao: varchar("tec_avaliacao", { length: 10 }).default("0.00"),
  tecLatitude: varchar("tec_latitude", { length: 20 }),
  tecLongitude: varchar("tec_longitude", { length: 20 }),
  tecAtivo: varchar("tec_ativo", { length: 10 }).default("true"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Tecnico = typeof tecnicos.$inferSelect;
export type InsertTecnico = typeof tecnicos.$inferInsert;

// Solicitacoes table - All fields prefixed with 'solic'
export const solicitacoes = mysqlTable("solicitacoes", {
  id: int("id").autoincrement().primaryKey(),
  solicNome: varchar("solic_nome", { length: 255 }).notNull(),
  solicProjeto: varchar("solic_projeto", { length: 255 }),
  solicServico: varchar("solic_servico", { length: 255 }),
  solicOperadora: varchar("solic_operadora", { length: 255 }),
  solicFreshdesk: varchar("solic_freshdesk", { length: 100 }),
  solicRua: varchar("solic_rua", { length: 255 }),
  solicNumero: varchar("solic_numero", { length: 10 }),
  solicComplemento: varchar("solic_complemento", { length: 255 }),
  solicBairro: varchar("solic_bairro", { length: 255 }),
  solicCidade: varchar("solic_cidade", { length: 255 }),
  solicUF: varchar("solic_uf", { length: 2 }),
  solicCEP: varchar("solic_cep", { length: 10 }),
  solicContatoLocal: varchar("solic_contato_local", { length: 255 }),
  solicDataAtividade: varchar("solic_data_atividade", { length: 20 }),
  solicHoraAtividade: varchar("solic_hora_atividade", { length: 20 }),
  solicStatus: varchar("solic_status", { length: 20 }).default("pendente"),
  solicDataConclusao: varchar("solic_data_conclusao", { length: 20 }),
  solicHorarioChegada: varchar("solic_horario_chegada", { length: 20 }),
  solicHorarioLiberacao: varchar("solic_horario_liberacao", { length: 20 }),
  solicHorarioTermino: varchar("solic_horario_termino", { length: 20 }),
  solicTotalHoras: varchar("solic_total_horas", { length: 20 }),
  solicFaturamento: varchar("solic_faturamento", { length: 20 }).default("Não Pago"),
  solicObservacoes: text("solic_observacoes"),
  solicTecnicoId: varchar("solic_tecnico_id", { length: 36 }), // UUID reference to tecnicos.id
  solicCriadoPor: varchar("solic_criado_por", { length: 36 }), // UUID reference to users.id
  solicDataCriacao: varchar("solic_data_criacao", { length: 20 }),
  solicLatitude: varchar("solic_latitude", { length: 20 }),
  solicLongitude: varchar("solic_longitude", { length: 20 }),
  solicEndereco: text("solic_endereco"),
  solicAtivo: varchar("solic_ativo", { length: 10 }).default("true"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Solicitacao = typeof solicitacoes.$inferSelect;
export type InsertSolicitacao = typeof solicitacoes.$inferInsert;

// Equipamentos History table - Tracks all equipment loans and returns
export const tecnicosEquipamentosHistorico = mysqlTable("tecnicos_equipamentos_historico", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  tecnicoId: varchar("tecnico_id", { length: 36 }).notNull(), // UUID reference to tecnicos.id
  equipamentoNome: text("equipamento_nome").notNull(),
  equipamentoMarca: varchar("equipamento_marca", { length: 100 }), // Aruba, Unifi, Cambium, Outro
  equipamentoModelo: varchar("equipamento_modelo", { length: 100 }),
  equipamentoIdEstoque: varchar("equipamento_id_estoque", { length: 100 }),
  equipamentoDescricao: text("equipamento_descricao"),
  dataSaida: timestamp("data_saida").defaultNow().notNull(),
  dataDevolucao: timestamp("data_devolucao"),
  status: varchar("status", { length: 20 }).default("emprestado").notNull(), // 'emprestado', 'devolvido', or 'usado_em_cliente'
  observacoes: text("observacoes"),
  criadoPor: varchar("criado_por", { length: 255 }),
  atualizadoPor: varchar("atualizado_por", { length: 255 }),
  equipAtivo: varchar("equip_ativo", { length: 10 }).default("true"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TecnicoEquipamentoHistorico = typeof tecnicosEquipamentosHistorico.$inferSelect;
export type InsertTecnicoEquipamentoHistorico = typeof tecnicosEquipamentosHistorico.$inferInsert;
