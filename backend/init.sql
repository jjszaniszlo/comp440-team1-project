CREATE TABLE IF NOT EXISTS `user` (
    username VARCHAR(50) PRIMARY KEY,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS `blog` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    author_username VARCHAR(50) NOT NULL,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_username) REFERENCES `user`(username) ON DELETE CASCADE,
    CHECK (upvotes >= 0),
    CHECK (downvotes >= 0),
    CHECK (status IN ('DRAFT', 'PUBLISHED')),
    FULLTEXT KEY `blog_search_idx` (subject, description, content)
);

CREATE TABLE IF NOT EXISTS `tag` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (LENGTH(name) > 0)
);

CREATE TABLE IF NOT EXISTS `blog_tag` (
    blog_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (blog_id, tag_id),
    FOREIGN KEY (blog_id) REFERENCES `blog`(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES `tag`(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `comment` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    sentiment BOOLEAN NOT NULL,
    blog_id INT NOT NULL,
    author_username VARCHAR(50) NOT NULL,
    parent_comment_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES `blog`(id) ON DELETE CASCADE,
    FOREIGN KEY (author_username) REFERENCES `user`(username) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES `comment`(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `user_limits` (
    username VARCHAR(50) PRIMARY KEY,
    comment_creation_limit INT NOT NULL DEFAULT 0,
    blog_creation_limit INT NOT NULL DEFAULT 0,
    FOREIGN KEY (username) REFERENCES `user`(username) ON DELETE CASCADE,
    CHECK (comment_creation_limit >= 0),
    CHECK (blog_creation_limit >= 0)
);

CREATE TABLE IF NOT EXISTS `user_daily_activity` (
    username VARCHAR(50) NOT NULL,
    activity_date DATE NOT NULL,
    comments_made INT NOT NULL DEFAULT 0,
    blogs_made INT NOT NULL DEFAULT 0,
    PRIMARY KEY (username, activity_date),
    FOREIGN KEY (username) REFERENCES `user`(username) ON DELETE CASCADE,
    CHECK (comments_made >= 0),
    CHECK (blogs_made >= 0)
);

CREATE TABLE IF NOT EXISTS `user_follow` (
    follower_username VARCHAR(50) NOT NULL,
    following_username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_username, following_username),
    FOREIGN KEY (follower_username) REFERENCES `user`(username) ON DELETE CASCADE,
    FOREIGN KEY (following_username) REFERENCES `user`(username) ON DELETE CASCADE,
    CHECK (follower_username != following_username)
);