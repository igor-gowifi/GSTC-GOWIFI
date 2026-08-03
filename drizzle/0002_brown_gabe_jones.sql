CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` int NOT NULL,
	`data_formatada` varchar(50),
	`usuario` varchar(320) NOT NULL,
	`usuario_nome` varchar(255),
	`acao` varchar(100) NOT NULL,
	`descricao` text,
	`tipo_documento` varchar(50),
	`id_documento` varchar(100),
	`dados_antes` json,
	`dados_depois` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
