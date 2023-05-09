<?php 
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {

        $_POST = json_decode(file_get_contents("php://input"), true);

        //mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        $servername = "localhost";
        $username = "root";
        $password = "";
        $db = "rating";

        $conn = mysqli_connect($servername, $username, $password, $db);

        if ($conn->connect_error) {
            echo json_encode([]);
        }
        else {

            $List = array();
            $i = 0;

            // нет авторизации
            if (empty($_POST["name"])) {
                $result = mysqli_query($conn,"select ROW_NUMBER() OVER(ORDER BY points DESC) no, points from ratingGame LIMIT 10", MYSQLI_USE_RESULT);
                if ($result) {

                    while ($row = mysqli_fetch_row($result)) {
                        $List[$i++] = array($row[0], $row[1]); 
                    }
                }
            }
            else {
                // есть авторизация
                $countRows = 0;

                $stmt = mysqli_prepare($conn, 'SELECT * FROM ratingGame WHERE userName=?');
                mysqli_stmt_bind_param($stmt, "s", $_POST["name"]);
                $check = mysqli_stmt_execute($stmt);

                if ($check) {

                    $res = mysqli_stmt_get_result($stmt);
                
                    // результата о таком пользователе ещё нет
                    if (!mysqli_num_rows($res)) {
                        $result = mysqli_query($conn,"select ROW_NUMBER() OVER(ORDER BY points DESC) no, userName, points from ratingGame LIMIT 10", MYSQLI_USE_RESULT);

                        if ($result) {
                            while ($row = mysqli_fetch_row($result)) {
                                $List[$i++] = array($row[0], $row[1], $row[2]); 
                            }
                        }
                    }
                    else {
                        // результат есть
                        $isLider = false;
                        $result = mysqli_query($conn,"select ROW_NUMBER() OVER(ORDER BY points DESC) no, userName, points from ratingGame LIMIT 10", MYSQLI_USE_RESULT);

                        if ($result) {

                            while ($row = mysqli_fetch_row($result)) {
                                if ($row[1] == $_POST["name"]) {
                                    $isLider = true;
                                }
                                $List[$i++] = array($row[0], $row[1], $row[2]); 
                            }

                            mysqli_free_result($result);
                        }

                        if (!$isLider) {
                            $result_all = mysqli_query($conn,"select ROW_NUMBER() OVER(ORDER BY points DESC) no, userName, points from ratingGame", MYSQLI_USE_RESULT);

                            if ($result_all) {

                                while ($row = mysqli_fetch_row($result_all)) {
                                    if ($row[1] == $_POST["name"]) {
                                        $List[9] = array($row[0], $row[1], $row[2]); 
                                        break;
                                    }
                                }
                                mysqli_free_result($result_all);
                            }
                        }
                    }
                }
            }

            
            $count_all = mysqli_query($conn,"select COUNT(*) from ratingGame", MYSQLI_USE_RESULT);

            if ($count_all) {
                // $List[count($List)] = mysqli_fetch_row($count_all)[0];
                $List[count($List)] = mysqli_fetch_row($count_all)[0];
            }

            // echo mysqli_error($conn);

            mysqli_close($conn);
            echo json_encode($List);
        }
    }
?>