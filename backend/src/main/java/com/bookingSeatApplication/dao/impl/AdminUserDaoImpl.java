package com.bookingSeatApplication.dao.impl;

import com.bookingSeatApplication.dao.AdminUserDao;
import com.bookingSeatApplication.model.AdminUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AdminUserDaoImpl implements AdminUserDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String FIND_BY_USERNAME =
            "SELECT * FROM admin_users WHERE username = ?";

    private static final String INSERT_ADMIN =
            "INSERT INTO admin_users(username, password) VALUES(?, ?)";


    @Override
    public AdminUser findByUsername(String username) {

        try{

            return jdbcTemplate.queryForObject(
                    FIND_BY_USERNAME,
                    (rs, rowNum) -> {

                        AdminUser admin = new AdminUser();
                        admin.setAdminId(rs.getInt("admin_id"));
                        admin.setUsername(rs.getString("username"));
                        admin.setPassword(rs.getString("password"));

                        return admin;
                    },
                    username
            );

        }
        catch (Exception e){
            return null;
        }
    }


    @Override
    public void save(AdminUser adminUser) {

        try{

            jdbcTemplate.update(
                    INSERT_ADMIN,
                    adminUser.getUsername(),
                    adminUser.getPassword()
            );

        }
        catch (Exception e){
            throw new RuntimeException("Database error while saving admin user", e);
        }
    }
}