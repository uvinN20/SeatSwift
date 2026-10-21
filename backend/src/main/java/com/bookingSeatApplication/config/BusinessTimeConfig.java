package com.bookingSeatApplication.config;
import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
@Configuration
@EnableScheduling
public class BusinessTimeConfig {
    @Bean public org.springframework.transaction.support.TransactionTemplate demoTransactions(org.springframework.transaction.PlatformTransactionManager manager) {
        return new org.springframework.transaction.support.TransactionTemplate(manager);
    }
    @Bean public Clock businessClock(@Value("${app.timezone:Asia/Colombo}") String zone) {
        return Clock.system(ZoneId.of(zone));
    }
}
