-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Creato il: Ago 15, 2024 alle 10:49
-- Versione del server: 5.7.40-log
-- Versione PHP: 8.3.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `calzolaio`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `attributi`
--

CREATE TABLE `attributi` (
  `id` int(11) NOT NULL,
  `attributo` varchar(20) NOT NULL,
  `colore` varchar(6) NOT NULL DEFAULT 'DCDCDC',
  `descrizione` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dump dei dati per la tabella `attributi`
--

INSERT INTO `attributi` (`id`, `attributo`, `colore`, `descrizione`) VALUES
(1, 'a', '00FFFF', 'Descrizione per attributo \"a\"'),
(2, 'd', '8B4513', 'Descrizione per attributo \"d\" Davide'),
(3, 'r', '32CD32', 'Descrizione per attributo \"r\" Renato'),
(4, 'am', 'FFB6C1', 'Descrizione per attributo \"am\" Attesa Materiali'),
(5, 'at', 'FF8C00', 'Descrizione per attributo \"at\" Attesa Messaggio'),
(6, 'wp', '7CFC00', 'Descrizione per attributo \"wp\" Work in Progress'),
(7, 'm', 'FF0000', 'Descrizione per attributo \"m\"'),
(8, 'NN', 'FFFFFF', NULL);

-- --------------------------------------------------------

--
-- Struttura della tabella `clienti`
--

CREATE TABLE `clienti` (
  `id` bigint(20) NOT NULL,
  `telefono` varchar(30) NOT NULL,
  `alias` varchar(50) NOT NULL,
  `cod_cliente` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dump dei dati per la tabella `clienti`
--

INSERT INTO `clienti` (`id`, `telefono`, `alias`, `cod_cliente`) VALUES
(1, '3483760064', 'Cliente 1235', 1),
(2, '3483760067', 'Cliente 2', 2),
(3, '3489090456', 'Cliente 3', 3);

-- --------------------------------------------------------

--
-- Struttura della tabella `lavori`
--

CREATE TABLE `lavori` (
  `id` bigint(20) NOT NULL,
  `cliente_id` bigint(20) NOT NULL,
  `stato_lavoro_id` int(11) NOT NULL,
  `data_inizio` date NOT NULL,
  `data_fine` date DEFAULT NULL,
  `note` mediumtext,
  `num_bigliettino` int(11) NOT NULL,
  `ritirato` tinyint(4) NOT NULL DEFAULT '0',
  `data_ritiro` date DEFAULT NULL,
  `attributo_id` int(10) DEFAULT '0',
  `scaffale` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dump dei dati per la tabella `lavori`
--

INSERT INTO `lavori` (`id`, `cliente_id`, `stato_lavoro_id`, `data_inizio`, `data_fine`, `note`, `num_bigliettino`, `ritirato`, `data_ritiro`, `attributo_id`, `scaffale`) VALUES
(1, 1, 1, '2024-08-01', NULL, 'cambiare suola aaahhh', 115, 0, NULL, 1, NULL),
(2, 2, 0, '2024-08-11', '2024-08-14', 'cambiare cappella', 1, 0, NULL, 2, NULL),
(3, 1, 1, '2024-08-01', '2024-08-08', 'fanculo', 14, 0, NULL, 5, 1);

-- --------------------------------------------------------

--
-- Struttura della tabella `statolavoro`
--

CREATE TABLE `statolavoro` (
  `id` smallint(6) NOT NULL,
  `titolo` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dump dei dati per la tabella `statolavoro`
--

INSERT INTO `statolavoro` (`id`, `titolo`) VALUES
(1, 'non pagato'),
(0, '');

-- --------------------------------------------------------

--
-- Struttura della tabella `whatsapp`
--

CREATE TABLE `whatsapp` (
  `id` bigint(20) NOT NULL,
  `cliente_id` bigint(20) NOT NULL,
  `data_invio` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `attributi`
--
ALTER TABLE `attributi`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `clienti`
--
ALTER TABLE `clienti`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `lavori`
--
ALTER TABLE `lavori`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `whatsapp`
--
ALTER TABLE `whatsapp`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `attributi`
--
ALTER TABLE `attributi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT per la tabella `clienti`
--
ALTER TABLE `clienti`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT per la tabella `lavori`
--
ALTER TABLE `lavori`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT per la tabella `whatsapp`
--
ALTER TABLE `whatsapp`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
