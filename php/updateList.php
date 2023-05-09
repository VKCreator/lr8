<?php 
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {

        $_POST = json_decode(file_get_contents("php://input"), true);

        $servername = "localhost";
        $username = "root";
        $password = "";
        $db = "rating";

        $conn = mysqli_connect($servername, $username, $password, $db);

        if ($conn->connect_error) {
            echo json_encode([]);
        } 
        else {

            $stmt = mysqli_prepare($conn, 'SELECT * FROM ratingGame WHERE BINARY userName=?');
            mysqli_stmt_bind_param($stmt, "s", $_POST["name"]);
            $check = mysqli_stmt_execute($stmt);

            if ($check) {
                $res = mysqli_stmt_get_result($stmt);

                if (!mysqli_num_rows($res)) {
                    $result = mysqli_prepare($conn, 'INSERT INTO ratingGame (userName, points) VALUES (?,?)');
                    mysqli_stmt_bind_param($result, "ss", $_POST["name"], intval($_POST["points"]));
                }
                else {
                    $result = mysqli_prepare($conn, 'UPDATE ratingGame SET points=? WHERE BINARY userName=? AND points < ?');
                    $intPoints = intval($_POST["points"]);
                    mysqli_stmt_bind_param($result, "sss", intval($_POST["points"]), $_POST["name"], intval($_POST["points"]));
                }

                mysqli_stmt_execute($result);
                mysqli_stmt_close($result);
            }

            mysqli_stmt_close($stmt);
            mysqli_close($conn);
        }
    }
?>