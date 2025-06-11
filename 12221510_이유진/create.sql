-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema term_project
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema term_project
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `term_project` DEFAULT CHARACTER SET utf8 ;
USE `term_project` ;

-- -----------------------------------------------------
-- Table `term_project`.`book`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`book` (
  `ISBN` VARCHAR(45) NOT NULL,
  `title` VARCHAR(45) NOT NULL,
  `category` VARCHAR(45) NULL,
  `price` VARCHAR(45) NULL,
  `year` YEAR(4) NULL,
  PRIMARY KEY (`ISBN`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`warehouse`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`warehouse` (
  `code` INT NOT NULL,
  `phone` VARCHAR(13) NULL,
  `address` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`code`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`inventory`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`inventory` (
  `book_ISBN` VARCHAR(45) NOT NULL,
  `warehouse_code` INT NOT NULL,
  `number` INT NOT NULL,
  PRIMARY KEY (`book_ISBN`, `warehouse_code`),
  INDEX `fk_book_has_warehouse_warehouse1_idx` (`warehouse_code` ASC) VISIBLE,
  INDEX `fk_book_has_warehouse_book_idx` (`book_ISBN` ASC) VISIBLE,
  CONSTRAINT `fk_book_has_warehouse_book`
    FOREIGN KEY (`book_ISBN`)
    REFERENCES `term_project`.`book` (`ISBN`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_book_has_warehouse_warehouse1`
    FOREIGN KEY (`warehouse_code`)
    REFERENCES `term_project`.`warehouse` (`code`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`shopping_basket`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`shopping_basket` (
  `basketID` INT NOT NULL,
  `order_date` INT NULL,
  PRIMARY KEY (`basketID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`contains`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`contains` (
  `book_ISBN` VARCHAR(45) NOT NULL,
  `shopping_basket_basketID` INT NOT NULL,
  `number` INT NOT NULL,
  PRIMARY KEY (`book_ISBN`, `shopping_basket_basketID`),
  INDEX `fk_book_has_shopping_basket_shopping_basket1_idx` (`shopping_basket_basketID` ASC) VISIBLE,
  INDEX `fk_book_has_shopping_basket_book1_idx` (`book_ISBN` ASC) VISIBLE,
  CONSTRAINT `fk_book_has_shopping_basket_book1`
    FOREIGN KEY (`book_ISBN`)
    REFERENCES `term_project`.`book` (`ISBN`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_book_has_shopping_basket_shopping_basket1`
    FOREIGN KEY (`shopping_basket_basketID`)
    REFERENCES `term_project`.`shopping_basket` (`basketID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`user` (
  `Id` VARCHAR(255) NOT NULL,
  `Password` VARCHAR(255) NOT NULL,
  `Role` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`Id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`customer`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`customer` (
  `Email` VARCHAR(45) NOT NULL,
  `phone` VARCHAR(45) NULL,
  `address` VARCHAR(45) NULL,
  `name` VARCHAR(255) NULL,
  PRIMARY KEY (`Email`, `name`),
  INDEX `fk_customer_user1_idx` (`name` ASC) VISIBLE,
  CONSTRAINT `fk_customer_user1`
    FOREIGN KEY (`name`)
    REFERENCES `term_project`.`user` (`Id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`reservation`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`reservation` (
  `Email` VARCHAR(255) NOT NULL,
  `book_ISBN` VARCHAR(45) NOT NULL,
  `reservation_date` DATE NOT NULL,
  `pickup_time` TIME NULL,
  `pickup_date` DATE NULL,
  PRIMARY KEY (`Email`),
  INDEX `fk_reservation_customer1_idx` (`Email` ASC) VISIBLE,
  INDEX `fk_reservation_book1_idx` (`book_ISBN` ASC) INVISIBLE,
  CONSTRAINT `fk_reservation_customer1`
    FOREIGN KEY (`Email`)
    REFERENCES `term_project`.`customer` (`Email`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_reservation_book1`
    FOREIGN KEY (`book_ISBN`)
    REFERENCES `term_project`.`book` (`ISBN`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`basket_of`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`basket_of` (
  `customer_Email` VARCHAR(45) NOT NULL,
  `shopping_basket_basketID` INT NOT NULL,
  PRIMARY KEY (`customer_Email`, `shopping_basket_basketID`),
  INDEX `fk_customer_has_shopping_basket_shopping_basket1_idx` (`shopping_basket_basketID` ASC) VISIBLE,
  INDEX `fk_customer_has_shopping_basket_customer1_idx` (`customer_Email` ASC) VISIBLE,
  CONSTRAINT `fk_customer_has_shopping_basket_customer1`
    FOREIGN KEY (`customer_Email`)
    REFERENCES `term_project`.`customer` (`Email`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_customer_has_shopping_basket_shopping_basket1`
    FOREIGN KEY (`shopping_basket_basketID`)
    REFERENCES `term_project`.`shopping_basket` (`basketID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`award`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`award` (
  `name` VARCHAR(45) NOT NULL,
  `year` YEAR(4) NULL,
  PRIMARY KEY (`name`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`author`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`author` (
  `name` VARCHAR(45) NOT NULL,
  `url` VARCHAR(45) NULL,
  `address` VARCHAR(45) NULL,
  PRIMARY KEY (`name`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`written_by`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`written_by` (
  `author_name` VARCHAR(45) NOT NULL,
  `book_ISBN` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`author_name`, `book_ISBN`),
  INDEX `fk_author_has_book_book1_idx` (`book_ISBN` ASC) VISIBLE,
  INDEX `fk_author_has_book_author1_idx` (`author_name` ASC) VISIBLE,
  CONSTRAINT `fk_author_has_book_author1`
    FOREIGN KEY (`author_name`)
    REFERENCES `term_project`.`author` (`name`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_author_has_book_book1`
    FOREIGN KEY (`book_ISBN`)
    REFERENCES `term_project`.`book` (`ISBN`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`received_by`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`received_by` (
  `author_name` VARCHAR(45) NOT NULL,
  `award_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`author_name`, `award_name`),
  INDEX `fk_author_has_award_award1_idx` (`award_name` ASC) VISIBLE,
  INDEX `fk_author_has_award_author1_idx` (`author_name` ASC) VISIBLE,
  CONSTRAINT `fk_author_has_award_author1`
    FOREIGN KEY (`author_name`)
    REFERENCES `term_project`.`author` (`name`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_author_has_award_award1`
    FOREIGN KEY (`award_name`)
    REFERENCES `term_project`.`award` (`name`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `term_project`.`awarded_to`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_project`.`awarded_to` (
  `award_name` VARCHAR(45) NOT NULL,
  `book_ISBN` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`award_name`, `book_ISBN`),
  INDEX `fk_award_has_book_book1_idx` (`book_ISBN` ASC) VISIBLE,
  INDEX `fk_award_has_book_award1_idx` (`award_name` ASC) VISIBLE,
  CONSTRAINT `fk_award_has_book_award1`
    FOREIGN KEY (`award_name`)
    REFERENCES `term_project`.`award` (`name`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_award_has_book_book1`
    FOREIGN KEY (`book_ISBN`)
    REFERENCES `term_project`.`book` (`ISBN`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
