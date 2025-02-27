-- MySQL dump 10.13  Distrib 9.1.0, for Win64 (x86_64)
--
-- Host: localhost    Database: bible
-- ------------------------------------------------------
-- Server version	9.1.0-commercial

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `bible`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `bible` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `bible`;

--
-- Table structure for table `bible_version_key`
--

DROP TABLE IF EXISTS `bible_version_key`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bible_version_key` (
  `id` int(3) unsigned zerofill NOT NULL AUTO_INCREMENT,
  `table` text NOT NULL COMMENT 'Database Table Name ',
  `abbreviation` text NOT NULL COMMENT 'Version Abbreviation',
  `language` text NOT NULL COMMENT 'Language of bible translation (used for language key tables)',
  `version` text NOT NULL COMMENT 'Version Name',
  `info_text` text NOT NULL COMMENT 'About / Info',
  `info_url` text NOT NULL COMMENT 'Info URL',
  `publisher` text NOT NULL COMMENT 'Publisher',
  `copyright` text NOT NULL COMMENT 'Copyright ',
  `copyright_info` text NOT NULL COMMENT 'Extended Copyright info',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1 COMMENT='This is the general translation information and db links';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book_info`
--

DROP TABLE IF EXISTS `book_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_info` (
  `order` int NOT NULL AUTO_INCREMENT,
  `title_short` text NOT NULL,
  `title_full` text NOT NULL,
  `abbreviation` text NOT NULL,
  `category` text NOT NULL,
  `otnt` text NOT NULL,
  `chapters` int DEFAULT NULL,
  PRIMARY KEY (`order`),
  UNIQUE KEY `order` (`order`),
  UNIQUE KEY `title_short` (`title_short`(255)),
  UNIQUE KEY `title_full` (`title_full`(255)),
  UNIQUE KEY `abbreviation` (`abbreviation`(255))
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `key_abbreviations_english`
--

DROP TABLE IF EXISTS `key_abbreviations_english`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `key_abbreviations_english` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT COMMENT 'Abbreviation ID',
  `a` varchar(255) NOT NULL,
  `b` smallint unsigned NOT NULL COMMENT 'ID of book that is abbreviated',
  `p` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether an abbreviation is the primary one for the book',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=410 DEFAULT CHARSET=latin1 COMMENT='A table mapping book abbreviations to the book they refer to';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `key_english`
--

DROP TABLE IF EXISTS `key_english`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `key_english` (
  `b` int NOT NULL COMMENT 'Book #',
  `n` text NOT NULL COMMENT 'Name',
  `t` varchar(2) NOT NULL COMMENT 'Which Testament this book is in',
  `g` tinyint unsigned NOT NULL COMMENT 'A genre ID to identify the type of book this is',
  PRIMARY KEY (`b`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `key_genre_english`
--

DROP TABLE IF EXISTS `key_genre_english`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `key_genre_english` (
  `g` tinyint unsigned NOT NULL AUTO_INCREMENT COMMENT 'Genre ID',
  `n` varchar(255) NOT NULL COMMENT 'Name of genre',
  PRIMARY KEY (`g`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1 COMMENT='Table mapping genre IDs to genre names for book table lookup';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `prayer_bible`
--

DROP TABLE IF EXISTS `prayer_bible`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prayer_bible` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prayerId` int NOT NULL,
  `version` varchar(20) NOT NULL,
  `b` int NOT NULL,
  `c` int NOT NULL,
  `v` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `prayerId` (`prayerId`),
  CONSTRAINT `prayer_bible_ibfk_1` FOREIGN KEY (`prayerId`) REFERENCES `prayers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `prayers`
--

DROP TABLE IF EXISTS `prayers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prayers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `isPrivate` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `prayers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_asv`
--

DROP TABLE IF EXISTS `t_asv`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_asv` (
  `id` int(8) unsigned zerofill NOT NULL,
  `b` int NOT NULL,
  `c` int NOT NULL,
  `v` int NOT NULL,
  `t` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_3` (`id`),
  KEY `id` (`id`),
  KEY `id_2` (`id`),
  KEY `id_4` (`id`),
  KEY `id_5` (`id`),
  KEY `id_6` (`id`),
  KEY `id_7` (`id`),
  KEY `id_8` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_bbe`
--

DROP TABLE IF EXISTS `t_bbe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_bbe` (
  `id` int(8) unsigned zerofill NOT NULL,
  `b` int NOT NULL,
  `c` int NOT NULL,
  `v` int NOT NULL,
  `t` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `id_2` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_cn`
--

DROP TABLE IF EXISTS `t_cn`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_cn` (
  `id` int NOT NULL AUTO_INCREMENT,
  `b` int NOT NULL,
  `c` int NOT NULL,
  `v` int NOT NULL,
  `t` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_kjv`
--

DROP TABLE IF EXISTS `t_kjv`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_kjv` (
  `id` int(8) unsigned zerofill NOT NULL,
  `b` int NOT NULL,
  `c` int NOT NULL,
  `v` int NOT NULL,
  `t` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_2` (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_web`
--

DROP TABLE IF EXISTS `t_web`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_web` (
  `id` int(8) unsigned zerofill NOT NULL,
  `b` int NOT NULL,
  `c` int NOT NULL,
  `v` int NOT NULL,
  `t` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_2` (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_ylt`
--

DROP TABLE IF EXISTS `t_ylt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_ylt` (
  `id` int(8) unsigned zerofill NOT NULL,
  `b` int NOT NULL,
  `c` int NOT NULL,
  `v` int NOT NULL,
  `t` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_2` (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-27 11:36:21
