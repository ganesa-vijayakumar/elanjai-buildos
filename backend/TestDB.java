import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class TestDB {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/elanjai_dev?createDatabaseIfNotExist=true&serverTimezone=UTC";
        String user = "root";
        String password = "root";

        System.out.println("Connecting to database: " + url);
        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("Connection successful!");
        } catch (SQLException e) {
            System.out.println("Connection failed!");
            e.printStackTrace();
        }
    }
}
