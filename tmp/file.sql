
DROP TABLE IF EXISTS table_name;

CREATE TABLE table_name (
  safe_id int unsigned not null primary key auto_increment,
  total_count int not null, 
  score_sum int not null, 
  domain varchar(255) not null
) CHARACTER SET utf8 COLLATE utf8_general_ci ENGINE=INNODB;

INSERT INTO table_name (`total_count`, `score_sum`, `domain`)
 VALUES
(1, 26, "2ality.com"),
(1, 110, "schneems.com"),
(1, 2, "ringzerolabs.com"),
(1, 1, "youtube.com"),
(1, 15, "code.nadeesha.me"),
(1, 24, "chrome.google.com"),
(1, 0, "codingthesmartway.com"),
(5, 103, "medium.com"),
(5, 271, "github.com"),
(9, 54, "self.javascript");